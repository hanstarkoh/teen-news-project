import * as cheerio from 'cheerio';
import { ProgramSource } from '@/lib/programSources';
import { scrapeText } from '@/lib/scrapeFetch';

export type ProgramListItem = {
  title: string;
  url: string;
  period: string;
  deadlineDate: string | null;
};

function parseEndDate(rangeText: string): string | null {
  const match = rangeText.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[2] : null;
}

// 'card' 타입 게시판(카드 목록 + 상세페이지)에서 프로그램 목록을 긁어옵니다.
async function fetchCardBoardItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('.program_list').each((_, el) => {
    const $item = $(el);
    const href = $item.find('a').first().attr('href');
    const title = $item.find('.program_inf strong').first().text().replace(/\s+/g, ' ').trim();
    const period = $item.find('.program_date span').first().text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;

    items.push({
      title,
      url: new URL(href, source.listUrl).href,
      period,
      deadlineDate: parseEndDate(period),
    });
  });

  return items;
}

// 'table' 타입 게시판(표 형태, 상세페이지 없음)에서 프로그램 목록을 긁어옵니다.
async function fetchTableBoardItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('table.tb2 tbody tr').each((_, el) => {
    const $tds = $(el).find('td');
    if ($tds.length < 3) return;

    const title = $tds.eq(0).text().replace(/\s+/g, ' ').trim();
    const period = $tds.eq(1).text().replace(/\s+/g, ' ').trim();
    const applyHref = $tds.eq(2).find('a').attr('href');
    if (!title || !period) return;

    // 신청 링크가 있으면 그걸 원문 링크로 쓰고, 마감돼서 링크가 없으면
    // 게시판 주소 + 제목으로 이 프로그램만의 고유 식별자를 만듭니다.
    const url = applyHref || `${source.listUrl}#${encodeURIComponent(title)}`;

    items.push({
      title,
      url,
      period,
      deadlineDate: parseEndDate(period),
    });
  });

  return items;
}

export async function fetchProgramListItems(source: ProgramSource): Promise<ProgramListItem[]> {
  return source.boardType === 'card' ? fetchCardBoardItems(source) : fetchTableBoardItems(source);
}

export type ProgramDetail = {
  targetAudience: string;
  contact: string;
  summary: string;
};

// 'card' 타입 상세페이지 본문을 AI로 요약해서 대상/연락처/한줄요약을 뽑아냅니다.
// (신청 기간·제목은 이미 목록에서 구조화된 값으로 확보했으므로, AI에게는 이 세 항목만 맡깁니다.)
export async function extractCardProgramDetail(source: ProgramSource, targetUrl: string, title: string): Promise<ProgramDetail> {
  const html = await scrapeText(targetUrl);
  const $ = cheerio.load(html);
  const rawText = $('.program_txt').first().text().replace(/\s+/g, ' ').trim()
    || $('.program_view .text').first().text().replace(/\s+/g, ' ').trim();

  if (!rawText) {
    return { targetAudience: '', contact: '', summary: '' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `
    너는 부산 청소년 프로그램 정보를 정리하는 편집 보조야.
    아래는 "${source.name}"의 프로그램 신청 게시글 "${title}"의 상세 내용이야.

    반드시 지켜야 할 규칙:
    1. [원본 텍스트]에 없는 내용은 절대로 지어내지 마. 확인 안 되는 값은 빈 문자열("")로 둬.
    2. 반드시 아래 JSON 형식으로만 응답해. 다른 설명이나 마크다운 코드블록 없이 JSON 객체 하나만 출력해.

    {
      "targetAudience": "모집 대상 (예: 14~19세 청소년)",
      "contact": "문의 연락처",
      "summary": "한두 문장 요약"
    }

    [원본 텍스트]: ${rawText}
  `;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  const data = await geminiRes.json();
  if (!geminiRes.ok) {
    console.error('AI 에러:', data);
    return { targetAudience: '', contact: '', summary: '' };
  }

  try {
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return {
      targetAudience: parsed.targetAudience || '',
      contact: parsed.contact || '',
      summary: parsed.summary || '',
    };
  } catch (err) {
    console.error('AI 응답 JSON 파싱 실패:', data);
    return { targetAudience: '', contact: '', summary: '' };
  }
}
