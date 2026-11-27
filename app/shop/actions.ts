"use server";

import { createClient } from "@/lib/supabase/server";

// 금액은 DB 함수가 정한다. 클라이언트가 보낸 금액은 믿지 않는다.
export async function createOrder(item: "wait" | "block", qty: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", { p_item: item, p_qty: qty });
  if (error) return { error: error.message };
  const row = (data as { order_id: string; amount: number }[])[0];
  return { orderId: row.order_id, amount: row.amount };
}
