import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { keywords } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // ⭐️ AI에게 내리는 '전문 기자' 빙의 프롬프트
    const prompt = `
      너는 부산 청소년 뉴스의 수석 기자야. 
      내가 제공하는 [취재 메모/키워드]를 바탕으로, 육하원칙에 맞는 완벽하고 흥미로운 뉴스 기사를 작성해줘.
      말투는 객관적인 뉴스 기사체(~다, ~밝혔다, ~전망이다)를 사용해.
      본문은 3문단 정도로 상세하게 적어줘.

      반드시 아래 형식에 맞춰서 답변해줘:
      제목: [여기에 기사 제목]
      본문: [여기에 기사 본문]

      [취재 메모/키워드]:
      ${keywords}
    `;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // AI가 준 답변에서 제목과 본문을 분리해내는 작업
    const titleMatch = text.match(/제목:\s*(.*)/);
    const contentMatch = text.match(/본문:\s*([\s\S]*)/);

    const title = titleMatch ? titleMatch[1].trim() : "AI가 제목을 생성하지 못했습니다.";
    const content = contentMatch ? contentMatch[1].trim() : text;

    return NextResponse.json({ title, content });
  } catch (error) {
    console.error("AI 기사 생성 에러:", error);
    return NextResponse.json({ error: "기사 생성 실패" }, { status: 500 });
  }
}