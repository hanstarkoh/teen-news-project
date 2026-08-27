import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { GallerySource } from '@/lib/gallerySources';
import { scrapeFetch, scrapeText } from '@/lib/scrapeFetch';
import { blurFacesUrl } from '@/lib/cloudinary';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type GalleryNotice = { title: string; url: string };

// 기관 갤러리 목록 페이지에서 게시물 목록을 긁어옵니다.
export async function fetchGalleryNotices(source: GallerySource): Promise<GalleryNotice[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);

  const notices: GalleryNotice[] = [];

  $(source.listItemSelector).each((_, el) => {
    const $item = $(el);
    const $link = source.listLinkSelector === 'self' ? $item : $item.find(source.listLinkSelector).first();

    const rawAttr = $link.attr(source.listLinkAttr || 'href');
    if (!rawAttr) return;

    let href = rawAttr;
    if (source.listLinkPattern) {
      const match = rawAttr.match(source.listLinkPattern);
      if (!match) return;
      href = match[1];
    }
    if (!href.includes(source.listLinkFilter)) return;

    const text = ($item.find(source.listTitleSelector).first().text() || $item.text())
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < 2) return;

    const absoluteUrl = href.startsWith('http') ? href : new URL(href, source.listUrl).href;
    if (!notices.find(n => n.url === absoluteUrl)) {
      notices.push({ title: text, url: absoluteUrl });
    }
  });

  return notices.slice(0, 10);
}

export type GeneratedDraft = { title: string; content: string; sourceImage: string };

// Cloudinary 무료 플랜의 fetch 용량 한도(10MB)를 넘는 사진은 블러 처리가 실패하므로,
// sharp로 줄여서 Supabase Storage에 올린 뒤 그 축소본을 블러 처리합니다.
const CLOUDINARY_FETCH_LIMIT = 9_000_000;

async function resolveBlurSourceUrl(buffer: Buffer, imageUrl: string): Promise<string> {
  if (buffer.length <= CLOUDINARY_FETCH_LIMIT) return imageUrl;

  try {
    const resizedBuffer = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const filePath = `gallery_resized/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage.from('images').upload(filePath, resizedBuffer, {
      contentType: 'image/jpeg',
    });

    if (uploadError) {
      console.error('리사이즈 이미지 업로드 실패:', uploadError);
      return '';
    }
    return supabaseAdmin.storage.from('images').getPublicUrl(filePath).data.publicUrl;
  } catch (resizeError) {
    console.error('이미지 축소 실패:', resizeError);
    return '';
  }
}

// 갤러리 게시물 하나를 스크래핑 + AI로 재작성해서 기사 초안을 만듭니다.
// (관리자 데스크의 수동 생성과 자동 크론 생성이 모두 이 함수를 공유합니다.)
export async function generateArticleFromPost(
  source: GallerySource,
  targetUrl: string,
  listTitle: string
): Promise<GeneratedDraft> {
  const html = await scrapeText(targetUrl);
  const $ = cheerio.load(html);

  const container = $(source.viewContainerSelector).first();
  const rawText = container.text().replace(/\s+/g, ' ').trim();

  let imageUrl = '';
  container.find('img').each((i, el) => {
    if (i === 0) {
      const src = $(el).attr('src');
      imageUrl = src ? new URL(src, targetUrl).href : '';
    }
  });

  if (!imageUrl) {
    throw new Error('갤러리에서 이미지를 찾을 수 없습니다.');
  }

  const imageRes = await scrapeFetch(imageUrl);
  const arrayBuffer = await imageRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');
  const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

  const blurSourceUrl = await resolveBlurSourceUrl(buffer, imageUrl);

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `
    너는 부산 청소년 뉴스의 전문 기자야.
    첨부된 사진은 "${source.name}"의 행사 현장 사진이고, 아래는 관련 텍스트야.
    사진 속 현장의 분위기와 텍스트 내용을 종합하여, 전문적인 뉴스 기사톤(~했습니다, ~밝혔습니다)으로 보도 기사를 작성해줘.

    반드시 지켜야 할 규칙 (매우 중요, 절대 위반하지 마):
    1. [원본 텍스트]에 실제로 없는 내용은 절대로 지어내지 마.
    2. 특히 "관계자는 ~라고 밝혔다", "~라고 전했다", "~라며 말했다" 같은 직접/간접 인용문은 [원본 텍스트]에 실제로 그런 발언이 적혀 있을 때만 써. 원본에 없는 발언·소감·코멘트를 절대로 지어내서 인용부호로 만들지 마.
    3. 확인되지 않은 숫자, 날짜, 통계, 계획을 추가하지 마.
    4. 인용할 발언이 없으면 그냥 "~진행됐다", "~열렸다", "~운영했다"처럼 사실을 서술하는 문장으로만 기사를 구성해.
    5. 초상권 보호를 위해 사진에 찍힌 사람들의 구체적인 인상착의나 얼굴은 절대 묘사하지 말고, 전체적인 현장 분위기만 서술해.

    형식:
    제목: [기사 제목]
    본문: [기사 본문]

    [기관명]: ${source.name}
    [원본 텍스트]: ${listTitle || ''} - ${rawText}
  `;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }]
    })
  });

  const data = await geminiRes.json();

  if (!geminiRes.ok) {
    console.error('AI 에러:', data);
    throw new Error('AI 분석 거절됨');
  }

  const aiText = data.candidates[0].content.parts[0].text;
  const titleMatch = aiText.match(/제목:\s*(.*)/);
  const contentMatch = aiText.match(/본문:\s*([\s\S]*)/);
  const stripStrayAsterisks = (s: string) => s.trim().replace(/^\*+\s*|\s*\*+$/g, '').trim();

  return {
    title: titleMatch ? stripStrayAsterisks(titleMatch[1]) : (listTitle || '제목 없음'),
    content: contentMatch ? stripStrayAsterisks(contentMatch[1]) : aiText,
    sourceImage: blurSourceUrl ? blurFacesUrl(blurSourceUrl) : '',
  };
}
