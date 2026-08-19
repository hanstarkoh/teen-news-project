import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { targetUrl } = await req.json();

    // 1. URL에서 HTML 긁어오기 (cheerio 사용)
    const res = await fetch(targetUrl);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('.bbsView .head p.tit').first().text().trim() || '제목 없음';
    const rawText = $('.bbsView .view').text().replace(/\s+/g, ' ').trim();

    // 갤러리 본문에서 첫 번째 이미지 주소 찾기
    let imageUrl = '';
    $('.bbsView .view img').each((i, el) => {
      if (i === 0) {
        const src = $(el).attr('src');
        imageUrl = src ? new URL(src, targetUrl).href : '';
      }
    });

    if (!imageUrl) {
      return NextResponse.json({ error: "갤러리에서 이미지를 찾을 수 없습니다." }, { status: 400 });
    }

    // 2. 이미지를 다운로드하여 Base64(문자열)로 변환 (AI에게 첨부파일로 보내기 위함)
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    // 3. Gemini 1.5 Flash (Vision) 본섭으로 다이렉트 전송
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    // ⭐️ AI 프롬프트 (뉴스톤 강제 및 초상권 보호 지시 포함)
    const prompt = `
      너는 부산 청소년 뉴스의 전문 기자야.
      첨부된 사진은 청소년 수련관의 행사 현장 사진이고, 아래는 관련 텍스트야.
      사진 속 현장의 분위기와 텍스트 내용을 종합하여, 전문적인 뉴스 기사톤(~했습니다, ~밝혔습니다)으로 보도 기사를 작성해줘.
      단, 초상권 보호를 위해 사진에 찍힌 사람들의 구체적인 인상착의나 얼굴은 절대 묘사하지 말고, 전체적인 현장 분위기만 서술해.

      형식:
      제목: [기사 제목]
      본문: [기사 본문]

      [원본 텍스트]: ${title} - ${rawText}
    `;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Image } } // 사진 데이터를 AI에게 전달
          ]
        }]
      })
    });

    const data = await geminiRes.json();
    
    if (!geminiRes.ok) {
      console.error("AI 에러:", data);
      return NextResponse.json({ error: "AI 분석 거절됨" }, { status: 500 });
    }

    // 4. 결과물 정리 후 프론트엔드로 전달
    const aiText = data.candidates[0].content.parts[0].text;
    const titleMatch = aiText.match(/제목:\s*(.*)/);
    const contentMatch = aiText.match(/본문:\s*([\s\S]*)/);

    return NextResponse.json({ 
      title: titleMatch ? titleMatch[1].trim() : title, 
      content: contentMatch ? contentMatch[1].trim() : aiText,
      sourceImage: imageUrl // 프론트엔드에서 개발자 확인용으로만 전달
    });

  } catch (error) {
    console.error("크롤링 서버 에러:", error);
    return NextResponse.json({ error: "기사 생성 실패" }, { status: 500 });
  }
}