import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { gallerySources } from '@/lib/gallerySources';
import { scrapeText } from '@/lib/scrapeFetch';

export async function POST(req: Request) {
  try {
    const { sourceId } = await req.json();
    const source = gallerySources.find(s => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: '알 수 없는 기관입니다.' }, { status: 400 });
    }

    const html = await scrapeText(source.listUrl);
    const $ = cheerio.load(html);

    const notices: { title: string, url: string }[] = [];

    $(source.listItemSelector).each((_, el) => {
      const $item = $(el);
      const $link = source.listLinkSelector === 'self' ? $item : $item.find(source.listLinkSelector).first();

      const rawAttr = $link.attr(source.listLinkAttr || 'href');
      if (!rawAttr) return;

      let href = rawAttr;
      if (source.listLinkPattern) {
        const match = rawAttr.match(source.listLinkPattern);
        if (!match) return;
        href = match[1];
      }
      if (!href.includes(source.listLinkFilter)) return;

      const text = ($item.find(source.listTitleSelector).first().text() || $item.text())
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length < 2) return;

      const absoluteUrl = href.startsWith('http') ? href : new URL(href, source.listUrl).href;
      if (!notices.find(n => n.url === absoluteUrl)) {
        notices.push({ title: text, url: absoluteUrl });
      }
    });

    return NextResponse.json({ notices: notices.slice(0, 10) });
  } catch (error) {
    console.error('갤러리 목록 크롤링 에러:', error);
    return NextResponse.json({ error: '갤러리 목록을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}
