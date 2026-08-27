import { NextResponse } from 'next/server';
import { gallerySources } from '@/lib/gallerySources';
import { generateArticleFromPost } from '@/lib/galleryScraper';

export async function POST(req: Request) {
  try {
    const { sourceId, targetUrl, listTitle } = await req.json();
    const source = gallerySources.find(s => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: '알 수 없는 기관입니다.' }, { status: 400 });
    }

    const draft = await generateArticleFromPost(source, targetUrl, listTitle);
    return NextResponse.json(draft);
  } catch (error) {
    console.error('크롤링 서버 에러:', error);
    const message = error instanceof Error ? error.message : '기사 생성 실패';
    return NextResponse.json({ error: message }, { status: message.includes('이미지를 찾을 수 없습니다') ? 400 : 500 });
  }
}
