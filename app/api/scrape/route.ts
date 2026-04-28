import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getSimilarity(str1: string, str2: string) {
  const clean1 = str1.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(Boolean);
  const clean2 = str2.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(Boolean);
  const set1 = new Set(clean1);
  const set2 = new Set(clean2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export async function GET() {
  try {
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('original_link, title')
      .eq('source_type', 'scraped')
      .order('published_at', { ascending: false })
      .limit(100);
      
    const existingLinks = existingArticles?.map(a => a.original_link) || [];
    const existingTitles = existingArticles?.map(a => a.title) || [];

    const res = await fetch('https://news.google.com/rss/search?q=청소년+부산&hl=ko&gl=KR&ceid=KR:ko', { cache: 'no-store' });
    const text = await res.text();

    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const newArticles = [];
    const newTitlesForCheck = [];

    // 1️⃣ 지역 키워드 (부산임을 확인)
    const busanSpecific = ['부산', '해운대', '수영구', '기장', '영도', '부산진구', '사하', '금정', '연제', '부울경'];
    const commonDistricts = ['남구', '동구', '북구', '중구', '서구', '강서구']; // 타 지역과 겹치는 이름

    // 2️⃣ 청소년/교육 키워드 (이 중 하나는 반드시 제목에 있어야 함)
    const youthKeywords = ['청소년', '학생', '학교', '교복', '급식', '초등', '중등', '고등', '수험생', '대입', '교육청', '교사', '선생님', '어린이', '꿈드림', '청소년수련'];

    for (const item of items) {
      const content = item[1];
      const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/);
      const linkMatch = content.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = content.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1];
        const cleanTitle = rawTitle.split(' - ')[0]; 
        const link = linkMatch[1];
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

        // 🛡️ 필터 1: 부산 지역 관련 기사인가?
        const isBusanSpecific = busanSpecific.some(k => cleanTitle.includes(k));
        const isCommonDistrictWithBusan = commonDistricts.some(k => cleanTitle.includes(k)) && cleanTitle.includes('부산');
        
        if (!isBusanSpecific && !isCommonDistrictWithBusan) continue;

        // 🛡️ 필터 2: 청소년/교육 관련 주제인가? (가장 중요!)
        const isYouthNews = youthKeywords.some(k => cleanTitle.includes(k));
        if (!isYouthNews) continue; // 주제가 청소년이 아니면 버림 (예: 해운대 교통사고 등 차단)

        // 1차 방어: 이미 똑같은 링크가 있는가?
        if (existingLinks.includes(link)) continue;

        // 2차 방어: 유사도 검사
        let isDuplicate = false;
        const allTitlesToCheck = [...existingTitles, ...newTitlesForCheck];

        for (const oldTitle of allTitlesToCheck) {
          const oldCleanTitle = oldTitle.split(' - ')[0];
          const similarity = getSimilarity(cleanTitle, oldCleanTitle);
          if (similarity > 0.35) { 
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          newArticles.push({
            title: rawTitle,
            summary: '타 언론사에서 보도한 뉴스입니다. 제목을 클릭해 원문을 확인해 주세요.',
            original_link: link,
            source_type: 'scraped',
            published_at: pubDate,
          });
          newTitlesForCheck.push(rawTitle);
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