import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ 서버 전용. service_role 키는 RLS를 우회하므로 절대 클라이언트(브라우저) 코드에서 쓰면 안 됩니다.
// API 라우트처럼 서버에서만 실행되는 코드에서, 익명 사용자가 할 수 없는 작업
// (예: 사진 리사이즈 후 Storage 업로드)을 대신 처리할 때만 사용하세요.
//
// 실제로 쓰일 때(getSupabaseAdmin() 호출 시점)에만 연결을 만듭니다 — import되자마자
// 바로 연결을 시도하면, 이 파일을 간접적으로 import만 하고 실제로는 쓰지 않는
// 다른 라우트까지 SUPABASE_SERVICE_ROLE_KEY 문제로 전부 죽어버릴 수 있기 때문입니다.
let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    cachedClient = createClient(supabaseUrl, serviceRoleKey);
  }
  return cachedClient;
}
