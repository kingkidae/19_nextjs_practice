"use server";

import { createClient } from "@/lib/supabase/server";

// 금액은 DB 함수가 정한다. 클라이언트가 보낸 금액은 믿지 않는다.
export async function createOrder(wait: number, block: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_bundle_order", { p_wait: wait, p_block: block });
  if (error) return { error: error.message };
  const row = (data as { order_id: string; amount: number }[])[0];
  return { orderId: row.order_id, amount: row.amount };
}
