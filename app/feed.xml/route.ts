import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SITE_URL = 'https://busanyouthnews.co.kr';

function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, summary, published_at')
    .eq('source_type', 'manual')
    .order('published_at', { ascending: false })
    .limit(30);

  const items = (articles || []).map((article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${SITE_URL}/article/${article.id}</link>
      <guid>${SITE_URL}/article/${article.id}</guid>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <description>${escapeXml((article.summary || '').slice(0, 300))}</description>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BY NEWS 부산청소년뉴스</title>
    <link>${SITE_URL}</link>
    <description>부산 청소년의 새로운 소식</description>
    <language>ko</language>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
