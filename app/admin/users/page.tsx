import { createClient } from "@/lib/supabase/server";
import { setRole } from "../actions";
import type { Profile } from "@/lib/types";

export default async function AdminUsers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);

  return (
    <section aria-labelledby="users-h">
      <h2 id="users-h" className="font-display text-3xl">회원 {data?.length ?? 0}명</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink">
            <th className="py-2">닉네임</th>
            <th>등급</th>
            <th>가입일</th>
            <th><span className="sr-only">등급 변경</span></th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((p: Profile & { created_at: string }) => (
            <tr key={p.id} className="border-b border-linen-dim">
              <td className="py-2 font-bold">{p.nickname}</td>
              <td>{p.role === "admin" ? <span className="rounded bg-siren px-2 text-linen">관리자</span> : "일반"}</td>
              <td>{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
              <td className="text-right">
                {p.id !== user?.id && (
                  <form action={setRole.bind(null, p.id, p.role === "admin" ? "user" : "admin")}>
                    <button className="rounded-full border-2 border-ink px-3 py-1 font-bold">
                      {p.role === "admin" ? "일반으로 내리기" : "관리자로 올리기"}
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
