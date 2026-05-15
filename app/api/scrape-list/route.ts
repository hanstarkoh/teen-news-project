import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { targetUrl } = await req.json();
    
    const res = await fetch(targetUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const notices: {title: string, url: string}[] = [];

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      
      if (href && (href.includes('view.php') || href.includes('read.jsp') || href.includes('board/view'))) {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        
        if (text.length > 5) {
          const absoluteUrl = href.startsWith('http') ? href : new URL(href, targetUrl).href;
          
          if (!notices.find(n => n.url === absoluteUrl)) {
            notices.push({ title: text, url: absoluteUrl });
          }
        }
      }
    });

    return NextResponse.json({ notices: notices.slice(0, 10) });
  } catch (error) {
    console.error("목록 크롤링 에러:", error);
    return NextResponse.json({ error: "목록을 불러오는 데 실패했습니다." }, { status: 500 });
  }
}