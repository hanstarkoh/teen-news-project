import { NextResponse } from 'next/server';
import { gallerySources } from '@/lib/gallerySources';
import { fetchGalleryNotices } from '@/lib/galleryScraper';

export async function POST(req: Request) {
  try {
    const { sourceId } = await req.json();
    const source = gallerySources.find(s => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: '알 수 없는 기관입니다.' }, { status: 400 });
    }

    const notices = await fetchGalleryNotices(source);
    return NextResponse.json({ notices });
  } catch (error) {
    console.error('갤러리 목록 크롤링 에러:', error);
    return NextResponse.json({ error: '갤러리 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}
