import { createClient } from '@supabase/supabase-js';

// ⚠️ 서버 전용. service_role 키는 RLS를 우회하므로 절대 클라이언트(브라우저) 코드에서 쓰면 안 됩니다.
// API 라우트처럼 서버에서만 실행되는 코드에서, 익명 사용자가 할 수 없는 작업
// (예: 사진 리사이즈 후 Storage 업로드)을 대신 처리할 때만 사용하세요.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
