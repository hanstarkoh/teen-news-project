import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. 지금 시간 기준으로 '24시간 전' 시간 계산
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // 2. 창고에서 24시간보다 이전에 써진 글들을 싹 지워버려라!
    const { error } = await supabase
      .from('bamboo_posts')
      .delete()
      .lt('created_at', yesterday.toISOString());

    if (error) throw error;

    return NextResponse.json({ success: true, message: '24시간 지난 익명 글 청소 완료!' });
  } catch (error) {
    return NextResponse.json({ error: '청소 실패' }, { status: 500 });
  }
}