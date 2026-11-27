import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 매 요청마다 Supabase 세션 쿠키를 갱신한다.
export async function proxy(request: NextRequest) {
  // Supabase 허용 목록에 /auth/callback 이 빠져 있으면 로그인 코드가 Site URL 첫 화면(/?code=)으로 온다.
  // 첫 화면에서만 콜백으로 넘긴다 (/shop/fail 도 code 파라미터를 쓰므로 다른 경로는 건드리지 않는다).
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && /^[0-9a-f-]{20,}$/i.test(searchParams.get("code") ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
