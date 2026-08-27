import { NextResponse } from 'next/server';
import { programSources } from '@/lib/programSources';
import { fetchProgramListItems, extractCardProgramDetail } from '@/lib/programScraper';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// generate-draft 크론과 동일한 이유로, 호출 1번에 프로그램 1개만 저장합니다.
// (Vercel Hobby 60초 제한 + vercel.json에 시간을 띄워 여러 번 등록)
export const maxDuration = 60;

const MAX_SOURCES_TO_CHECK = 9;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingPrograms } = await supabaseAdmin.from('programs').select('original_link');
  const seenLinks = new Set((existingPrograms || []).map(p => p.original_link).filter(Boolean));
  const todayKST = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

  const shuffledSources = [...programSources].sort(() => Math.random() - 0.5);

  for (const source of shuffledSources.slice(0, MAX_SOURCES_TO_CHECK)) {
    try {
      const items = await fetchProgramListItems(source);
      // 이미 마감됐거나(onclick 계열은 상태 텍스트로, 그 외엔 접수기간으로 판단) 접수기간이 지난 글은
      // 관리자 승인 큐에 올릴 필요가 없으므로 건너뜁니다.
      const freshItem = items.find(n =>
        !seenLinks.has(n.url) &&
        !n.closed &&
        (!n.deadlineDate || n.deadlineDate >= todayKST)
      );
      if (!freshItem) continue;

      // 전용 신청 게시판에서 긁어온 글이라 이미 "진짜 프로그램"임이 보장되므로,
      // 공지사항 게시판과 달리 AI에게 프로그램 여부를 판단시킬 필요가 없습니다.
      // onclick 계열은 목록 자체에 대상 정보가 이미 있어 AI 호출 없이 바로 씁니다.
      const detail = source.boardType === 'card'
        ? await extractCardProgramDetail(source, freshItem.url, freshItem.title)
        : { targetAudience: freshItem.targetAudience || '', contact: '', summary: '' };

      const { error } = await supabaseAdmin.from('programs').insert([{
        source_id: source.id,
        institution_name: source.name,
        is_program: true,
        program_name: freshItem.title,
        target_audience: detail.targetAudience,
        period: freshItem.period,
        deadline: freshItem.deadlineDate ? `${freshItem.deadlineDate}까지` : freshItem.period,
        deadline_date: freshItem.deadlineDate,
        contact: detail.contact,
        summary: detail.summary,
        original_link: freshItem.url,
        lat: source.lat,
        lng: source.lng,
        address: source.address,
        approved: false,
      }]);

      if (error) {
        console.error('프로그램 저장 실패:', error);
        return NextResponse.json({ error: '프로그램 저장 실패', detail: error.message }, { status: 500 });
      }

      return NextResponse.json({
        scanned: true,
        sourceId: source.id,
        sourceName: source.name,
        programName: freshItem.title,
      });
    } catch (err) {
      console.error(`${source.id} 프로그램 스캔 실패:`, err);
    }
  }

  return NextResponse.json({ scanned: false, message: '새로 확인할 게시물이 없습니다.' });
}
