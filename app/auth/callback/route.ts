import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 첫 로그인이면 프로필부터 채우게 한다
      const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).single();
      if (profile && !profile.onboarded) {
        return NextResponse.redirect(`${origin}/profile?welcome=1&next=${encodeURIComponent(next)}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
