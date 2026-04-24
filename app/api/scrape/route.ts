import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // ⭐️ 1. 우리 창고에 이미 저장된 '타 언론사 기사'들의 링크 주소를 싹 가져옵니다. (중복 검사용)
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('original_link')
      .eq('source_type', 'scraped');
      
    const existingLinks = existingArticles?.map(a => a.original_link) || [];

    // 2. 구글 뉴스 가져오기 (예: 청소년 OR 부산)
    const res = await fetch('https://news.google.com/rss/search?q=청소년+부산&hl=ko&gl=KR&ceid=KR:ko', { cache: 'no-store' });
    const text = await res.text();

    // 3. 가져온 뉴스에서 제목과 링크를 뽑아냅니다.
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

        // ⭐️ 4. 핵심! 기존 링크 목록에 '없는' 기사일 때만 새 기사 상자에 담습니다.
        if (!existingLinks.includes(link)) {
          newArticles.push({
            title: title,
            summary: '타 언론사에서 보도한 뉴스입니다. 제목을 클릭해 원문을 확인해 주세요.',
            original_link: link,
            source_type: 'scraped', // 시스템 상으로는 scraped로 유지
            published_at: pubDate,
          });
        }
      }
    }

    // 5. 중복을 거르고 남은 '진짜 새 기사'만 창고에 넣습니다. (한 번에 최대 10개까지만)
    if (newArticles.length > 0) {
      await supabase.from('articles').insert(newArticles.slice(0, 10));
    }

    return NextResponse.json({ success: true, count: newArticles.length });
  } catch (error) {
    return NextResponse.json({ error: '스크랩 실패' }, { status: 500 });
  }
}