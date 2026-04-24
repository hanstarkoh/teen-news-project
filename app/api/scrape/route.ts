import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ⭐️ 핵심 추가: "절대 예전 결과를 기억(캐시)하지 말고 매번 새로 긁어와라!"
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('original_link')
      .eq('source_type', 'scraped');
      
    const existingLinks = existingArticles?.map(a => a.original_link) || [];

    const res = await fetch('https://news.google.com/rss/search?q=청소년+부산&hl=ko&gl=KR&ceid=KR:ko', { cache: 'no-store' });
    const text = await res.text();

    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const newArticles = [];

    for (const item of items) {
      const content = item[1];
      const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/);
      const linkMatch = content.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = content.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1];
        const link = linkMatch[1];
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

        if (!existingLinks.includes(link)) {
          newArticles.push({
            title: title,
            summary: '타 언론사에서 보도한 뉴스입니다. 제목을 클릭해 원문을 확인해 주세요.',
            original_link: link,
            source_type: 'scraped',
            published_at: pubDate,
          });
        }
      }
    }

    const articlesToInsert = newArticles.slice(0, 15);

    if (articlesToInsert.length > 0) {
      await supabase.from('articles').insert(articlesToInsert);
    }

    return NextResponse.json({ success: true, count: articlesToInsert.length });
  } catch (error) {
    return NextResponse.json({ error: '스크랩 실패' }, { status: 500 });
  }
}