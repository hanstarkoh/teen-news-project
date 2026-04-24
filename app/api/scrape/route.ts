import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

// 캐시(기억) 무시하고 항상 최신 뉴스 가져오기
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // 1. 구글 뉴스 자판기(RSS)에서 '부산 청소년' 검색 결과 가져오기 (절대 안 막힘!)
    const response = await fetch('https://news.google.com/rss/search?q=부산+청소년&hl=ko&gl=KR&ceid=KR:ko', {
      cache: 'no-store'
    });
    
    // HTML이 아니라 XML이라는 형식으로 데이터를 받아옵니다.
    const xmlString = await response.text();

    // 2. Cheerio 도구로 XML 분석 모드 켜기
    const $ = cheerio.load(xmlString, { xmlMode: true });
    const articles: any[] = [];

    // 3. <item> 이라는 이름표를 단 기사 덩어리들을 하나씩 뽑아내기
    $('item').each((index, element) => {
      const title = $(element).find('title').text();
      const original_link = $(element).find('link').text();
      // 뉴스 자판기는 발행 시간도 정확하게 알려줍니다.
      const published_at = new Date($(element).find('pubDate').text()).toISOString();
      
      if (title && original_link) {
        articles.push({
          source_type: 'scraped',
          title: title,
          original_link: original_link,
          // 구글 자판기는 요약이나 썸네일이 예쁘지 않아서 기본값으로 세팅합니다.
          summary: '기사 원문 링크를 클릭해서 자세한 내용을 확인해 주세요.',
          thumbnail_url: null, 
          published_at: published_at,
        });
      }
    });

    // 4. 상위 5개만 자르기
    const topArticles = articles.slice(0, 5);

    if (topArticles.length === 0) {
      return NextResponse.json({ message: '기사를 찾지 못했습니다.', count: 0 });
    }

    // 5. 우리 창고(Supabase)에 밀어 넣기
    const { error } = await supabase.from('articles').insert(topArticles);

    if (error) throw error;

    return NextResponse.json({ 
      message: '구글 뉴스 스크랩 및 창고 저장 대성공! 🎉', 
      count: topArticles.length, 
      data: topArticles 
    });

  } catch (error) {
    console.error('스크랩 에러:', error);
    return NextResponse.json({ error: '스크랩 중 문제가 발생했습니다.' }, { status: 500 });
  }
}