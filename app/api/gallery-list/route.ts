import { NextResponse } from 'next/server';
import { gallerySources } from '@/lib/gallerySources';
import { fetchGalleryNotices } from '@/lib/galleryScraper';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { sourceId } = await req.json();
    const source = gallerySources.find(s => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: '알 수 없는 기관입니다.' }, { status: 400 });
    }

    const notices = await fetchGalleryNotices(source);

    // 관리자가 수동으로 불러올 때도, 이미 발행됐거나 초안으로 대기 중인 글은
    // 대기실에 다시 올라오지 않게 걸러냅니다 (안 그러면 활동이 뜸한 기관일수록
    // 같은 옛날 글을 계속 또 보게 되고, 모르고 다시 발행하면 중복 에러가 납니다).
    const urls = notices.map(n => n.url);
    const [{ data: published }, { data: pendingDrafts }] = await Promise.all([
      supabase.from('articles').select('original_link').in('original_link', urls),
      supabase.from('draft_articles').select('original_link').in('original_link', urls),
    ]);
    const seenLinks = new Set([
      ...(published || []).map(a => a.original_link),
      ...(pendingDrafts || []).map(d => d.original_link),
    ]);

    const freshNotices = notices.filter(n => !seenLinks.has(n.url));
    return NextResponse.json({ notices: freshNotices });
  } catch (error) {
    console.error('갤러리 목록 크롤링 에러:', error);
    return NextResponse.json({ error: '갤러리 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}
