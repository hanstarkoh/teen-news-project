import { NextResponse } from 'next/server';
import { programSources } from '@/lib/programSources';
import { fetchGalleryNotices } from '@/lib/galleryScraper';
import { extractProgramFromPost } from '@/lib/programScraper';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// generate-draft 크론과 동일한 이유로, 호출 1번에 프로그램 1개만 저장합니다.
// (Vercel Hobby 60초 제한 + vercel.json에 시간을 띄워 여러 번 등록)
export const maxDuration = 60;

const MAX_SOURCES_TO_CHECK = 4;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingPrograms } = await supabaseAdmin.from('programs').select('original_link');
  const seenLinks = new Set((existingPrograms || []).map(p => p.original_link).filter(Boolean));

  const shuffledSources = [...programSources].sort(() => Math.random() - 0.5);

  for (const source of shuffledSources.slice(0, MAX_SOURCES_TO_CHECK)) {
    try {
      const notices = await fetchGalleryNotices(source);
      const freshNotice = notices.find(n => !seenLinks.has(n.url));
      if (!freshNotice) continue;

      const extracted = await extractProgramFromPost(source, freshNotice.url, freshNotice.title);

      // 신청/모집 공고가 아니면 그냥 "확인함" 처리만 하고 다음 호출로 넘어갑니다.
      // (저장은 안 하되, seenLinks에는 없으므로 다음 실행에서 같은 글을 또 분석하지 않도록
      //  거절된 글도 approved:false, isProgram:false 상태로 남겨서 재분석을 막습니다.)
      const { error } = await supabaseAdmin.from('programs').insert([{
        source_id: source.id,
        institution_name: source.name,
        is_program: extracted.isProgram,
        program_name: extracted.programName,
        target_audience: extracted.targetAudience,
        period: extracted.period,
        deadline: extracted.deadline,
        deadline_date: extracted.deadlineDate,
        contact: extracted.contact,
        summary: extracted.summary,
        original_link: freshNotice.url,
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
        isProgram: extracted.isProgram,
        programName: extracted.programName,
      });
    } catch (err) {
      console.error(`${source.id} 프로그램 스캔 실패:`, err);
    }
  }

  return NextResponse.json({ scanned: false, message: '새로 확인할 게시물이 없습니다.' });
}
