import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export async function createClient() {
  // Supabase 는 세션 만료 확인에 Date.now() 를 쓴다. 요청 시점 렌더링임을 먼저 알린다.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component 에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts 가 맡는다.
          }
        },
      },
    },
  );
}
