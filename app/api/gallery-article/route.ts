import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { gallerySources } from '@/lib/gallerySources';
import { scrapeFetch, scrapeText } from '@/lib/scrapeFetch';

export async function POST(req: Request) {
  try {
    const { sourceId, targetUrl, listTitle } = await req.json();
    const source = gallerySources.find(s => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: '알 수 없는 기관입니다.' }, { status: 400 });
    }

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
      return NextResponse.json({ error: '갤러리에서 이미지를 찾을 수 없습니다.' }, { status: 400 });
    }

    // 이미지를 다운로드하여 Base64로 변환 (AI에게 첨부파일로 보내기 위함)
    const imageRes = await scrapeFetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const prompt = `
      너는 부산 청소년 뉴스의 전문 기자야.
      첨부된 사진은 "${source.name}"의 행사 현장 사진이고, 아래는 관련 텍스트야.
      사진 속 현장의 분위기와 텍스트 내용을 종합하여, 전문적인 뉴스 기사톤(~했습니다, ~밝혔습니다)으로 보도 기사를 작성해줘.
      단, 초상권 보호를 위해 사진에 찍힌 사람들의 구체적인 인상착의나 얼굴은 절대 묘사하지 말고, 전체적인 현장 분위기만 서술해.

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
      return NextResponse.json({ error: 'AI 분석 거절됨' }, { status: 500 });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const titleMatch = aiText.match(/제목:\s*(.*)/);
    const contentMatch = aiText.match(/본문:\s*([\s\S]*)/);
    const stripStrayAsterisks = (s: string) => s.trim().replace(/^\*+\s*|\s*\*+$/g, '').trim();

    return NextResponse.json({
      title: titleMatch ? stripStrayAsterisks(titleMatch[1]) : (listTitle || '제목 없음'),
      content: contentMatch ? stripStrayAsterisks(contentMatch[1]) : aiText,
      sourceImage: imageUrl,
    });

  } catch (error) {
    console.error('크롤링 서버 에러:', error);
    return NextResponse.json({ error: '기사 생성 실패' }, { status: 500 });
  }
}
