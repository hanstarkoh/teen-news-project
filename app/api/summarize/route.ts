import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 환경 변수에서 API 키를 가져와 구글 AI 로봇을 깨웁니다.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // 가장 빠르고 똑똑한 최신 무료 모델 선택
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI에게 내릴 강력한 명령 (프롬프트)
    const prompt = `
      너는 부산 청소년 뉴스의 친절한 AI 에디터야. 
      다음 기사 본문을 읽고, 10대들이 이해하기 쉽도록 친근한 말투(해요체)로 딱 3줄로 핵심만 요약해줘. 
      각 줄 끝에는 내용과 어울리는 이모지를 하나씩 꼭 넣어줘.

      기사 내용:
      ${content}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("AI 요약 에러:", error);
    return NextResponse.json({ error: "요약 실패" }, { status: 500 });
  }
}