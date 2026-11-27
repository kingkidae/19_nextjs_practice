import "server-only";
import { createClient } from "@supabase/supabase-js";

// service_role 권한. 결제 승인 후 아이템 지급에만 쓴다. 절대 클라이언트로 import 하지 말 것.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
