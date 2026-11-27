import { createClient } from "@supabase/supabase-js";

// 로그인과 무관한 공개 데이터용. 쿠키를 읽지 않아서 캐시('use cache') 안에서 쓸 수 있다.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
