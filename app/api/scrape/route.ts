import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ⭐️ 핵심 기술: 두 제목이 얼마나 비슷한지 검사하는 함수
function getSimilarity(str1: string, str2: string) {
  // 특수문자 빼고 띄어쓰기 기준으로 단어만 추출
  const clean1 = str1.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(Boolean);
  const clean2 = str2.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(Boolean);

  const set1 = new Set(clean1);
  const set2 = new Set(clean2);

  // 겹치는 단어 개수 계산
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size; // 0 ~ 1 사이의 유사도 점수 반환
}

export async function GET() {
  try {
    // 1. 기존 창고에서 최근 기사들의 '링크'와 '제목'을 모두 가져옵니다 (최근 100개)
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
    const newTitlesForCheck = []; // 이번에 새로 수집한 제목들도 서로 중복되지 않게 기록

    for (const item of items) {
      const content = item[1];
      const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/);
      const linkMatch = content.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = content.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1];
        
        // 구글 뉴스는 제목 뒤에 " - 조선일보" 처럼 언론사명이 붙으므로 떼어내고 핵심 제목만 비교
        const cleanTitle = rawTitle.split(' - ')[0]; 
        const link = linkMatch[1];
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

        // 🛡️ 1차 방어: 이미 똑같은 링크가 있는가?
        if (existingLinks.includes(link)) continue;

        // 🛡️ 2차 방어: 제목이 기존 기사나 방금 담은 기사와 너무 비슷한가?
        let isDuplicate = false;
        const allTitlesToCheck = [...existingTitles, ...newTitlesForCheck];

        for (const oldTitle of allTitlesToCheck) {
          const oldCleanTitle = oldTitle.split(' - ')[0];
          const similarity = getSimilarity(cleanTitle, oldCleanTitle);

          // ⭐️ 유사도 점수가 0.35(35%) 이상이면 같은 내용의 기사로 간주하고 컷!
          if (similarity > 0.35) { 
            isDuplicate = true;
            break;
          }
        }

        // 모든 방어를 통과한 '진짜 완전히 새로운' 뉴스만 담습니다.
        if (!isDuplicate) {
          newArticles.push({
            title: rawTitle,
            summary: '타 언론사에서 보도한 뉴스입니다. 제목을 클릭해 원문을 확인해 주세요.',
            original_link: link,
            source_type: 'scraped',
            published_at: pubDate,
          });
          newTitlesForCheck.push(rawTitle); // 방금 담은 제목도 검사망에 추가
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