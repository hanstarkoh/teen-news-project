import * as cheerio from 'cheerio';
import { ProgramSource } from '@/lib/programSources';
import { scrapeText } from '@/lib/scrapeFetch';

export type ExtractedProgram = {
  isProgram: boolean;
  programName: string;
  targetAudience: string;
  period: string;
  deadline: string;
  contact: string;
  summary: string;
};

// 공지사항 글 하나를 읽고, "청소년이 신청할 수 있는 프로그램"인지 AI가 판단해서
// 구조화된 정보(대상/기간/마감일/연락처/요약)를 뽑아냅니다.
// 요금 변경, 분실물 안내 같은 프로그램이 아닌 공지는 isProgram: false로 걸러집니다.
export async function extractProgramFromPost(
  source: ProgramSource,
  targetUrl: string,
  listTitle: string
): Promise<ExtractedProgram> {
  const html = await scrapeText(targetUrl);
  const $ = cheerio.load(html);

  const container = $(source.viewContainerSelector).first();
  const rawText = container.text().replace(/\s+/g, ' ').trim();

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `
    너는 부산 청소년 프로그램 정보를 정리하는 편집 보조야.
    아래는 "${source.name}"의 공지사항 게시글이야. 이게 청소년이 실제로 신청/참여할 수 있는
    프로그램·모집 공고인지 판단하고, 맞다면 정보를 정리해줘.

    반드시 지켜야 할 규칙:
    1. [원본 텍스트]에 없는 내용은 절대로 지어내지 마. 확인 안 되는 값은 빈 문자열("")로 둬.
    2. 요금 변경, 분실물 안내, 시설 휴관, 단순 소식 전달처럼 "신청/모집"이 아닌 글은 isProgram을 false로 해.
    3. 날짜/마감일/대상은 원본에 적힌 표현을 최대한 그대로 옮겨 적어.
    4. 반드시 아래 JSON 형식으로만 응답해. 다른 설명이나 마크다운 코드블록 없이 JSON 객체 하나만 출력해.

    {
      "isProgram": true 또는 false,
      "programName": "프로그램/모집 이름",
      "targetAudience": "모집 대상 (예: 14~19세 청소년 3인 이상)",
      "period": "활동/프로그램 진행 기간",
      "deadline": "신청 마감일 (상시모집이면 '상시모집')",
      "contact": "문의 연락처",
      "summary": "한두 문장 요약"
    }

    [게시글 제목]: ${listTitle}
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
    throw new Error('AI 분석 거절됨');
  }

  const aiText = data.candidates[0].content.parts[0].text;

  try {
    const parsed = JSON.parse(aiText);
    return {
      isProgram: Boolean(parsed.isProgram),
      programName: parsed.programName || listTitle,
      targetAudience: parsed.targetAudience || '',
      period: parsed.period || '',
      deadline: parsed.deadline || '',
      contact: parsed.contact || '',
      summary: parsed.summary || '',
    };
  } catch (err) {
    console.error('AI 응답 JSON 파싱 실패:', aiText);
    throw new Error('AI 응답을 이해하지 못했습니다.');
  }
}
