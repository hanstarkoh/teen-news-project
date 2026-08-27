import { NextResponse } from 'next/server';
import { gallerySources } from '@/lib/gallerySources';
import { fetchGalleryNotices, generateArticleFromPost } from '@/lib/galleryScraper';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Vercel Hobby 플랜의 서버리스 함수 제한 시간(60초) 안에 끝나야 해서,
// 이 라우트는 매 호출마다 딱 1개의 초안만 만듭니다.
// vercel.json에 이 라우트를 하루 여러 번(시간을 몇 분씩 띄워서) 호출하는
// 크론 작업을 여러 개 등록해서, 하루 총 N개의 초안이 쌓이도록 합니다.
export const maxDuration = 60;

// 한 번의 호출에서 "새 게시물이 있는 기관"을 찾기 위해 확인해볼 기관 수 상한.
// (전부 확인하면 시간 초과 위험이 있어서 제한을 둡니다.)
const MAX_SOURCES_TO_CHECK = 8;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: publishedArticles }, { data: existingDrafts }] = await Promise.all([
    supabaseAdmin.from('articles').select('original_link'),
    supabaseAdmin.from('draft_articles').select('original_link'),
  ]);

  const seenLinks = new Set([
    ...(publishedArticles || []).map(a => a.original_link).filter(Boolean),
    ...(existingDrafts || []).map(d => d.original_link).filter(Boolean),
  ]);

  // 매번 무작위 순서로 섞어서, 특정 기관이 항상 먼저 선택되는 편중을 막습니다.
  const shuffledSources = [...gallerySources].sort(() => Math.random() - 0.5);

  for (const source of shuffledSources.slice(0, MAX_SOURCES_TO_CHECK)) {
    try {
      const notices = await fetchGalleryNotices(source);
      const freshNotice = notices.find(n => !seenLinks.has(n.url));
      if (!freshNotice) continue;

      const draft = await generateArticleFromPost(source, freshNotice.url, freshNotice.title);
      const { error } = await supabaseAdmin.from('draft_articles').insert([{
        source_id: source.id,
        source_name: source.name,
        title: draft.title,
        content: draft.content,
        image_url: draft.sourceImage,
        original_link: freshNotice.url,
      }]);

      if (error) {
        console.error('초안 저장 실패:', error);
        return NextResponse.json({ error: '초안 저장 실패', detail: error.message }, { status: 500 });
      }

      return NextResponse.json({ generated: true, sourceId: source.id, sourceName: source.name, title: draft.title });
    } catch (err) {
      console.error(`${source.id} 초안 생성 실패:`, err);
      // 이 기관에서 실패해도 다음 기관으로 계속 시도합니다.
    }
  }

  return NextResponse.json({ generated: false, message: '새로 만들 초안이 없습니다.' });
}
