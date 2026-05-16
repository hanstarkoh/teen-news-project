import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { targetUrl } = await req.json();

    const res = await fetch(targetUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, footer, header, aside, .menu, .gnb').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "내용을 찾을 수 없습니다." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      너는 부산 청소년 뉴스의 수석 기자야. 
      다음은 청소년 관련 기관 홈페이지에서 방금 긁어온 [공지사항/행사] 텍스트야.
      이 딱딱한 글을 읽고, 흥미로운 '뉴스 기사'로 재작성해줘.

      형식:
      제목: [기사 제목]
      본문: [기사 본문]

      [원본 텍스트]:
      ${rawText}
    `;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    const titleMatch = text.match(/제목:\s*(.*)/);
    const contentMatch = text.match(/본문:\s*([\s\S]*)/);

    const title = titleMatch ? titleMatch[1].trim() : "새로운 청소년 행사 소식";
    const content = contentMatch ? contentMatch[1].trim() : text;

    return NextResponse.json({ title, content });
  } catch (error) {
    console.error("URL 크롤링 에러:", error);
    return NextResponse.json({ error: "기사 생성 실패" }, { status: 500 });
  }
}