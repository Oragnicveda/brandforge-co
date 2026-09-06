import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const FREE_CREDITS = 4;
export const COOLDOWN_MS = 12 * 60 * 60 * 1000;
export const COSTS = { tokenomics: 1, whitepaper: 2, social: 2, deck: 2, emails: 2, calendar: 2, community: 2, seo: 2, growth: 2 } as const;
export type CreditKind = keyof typeof COSTS;

export async function getOrCreateCredits(
  supabase: SupabaseClient<Database, "public", "public">,
  userId: string,
) {
  const { data: row } = await supabase
    .from("credits")
    .select("balance, is_paid, exhausted_at, next_free_at")
    .eq("user_id", userId)
    .single();

  if (row) return row;

  const { data: inserted, error } = await supabase
    .from("credits")
    .insert({
      user_id: userId,
      balance: FREE_CREDITS,
      is_paid: false,
    })
    .select("balance, is_paid, exhausted_at, next_free_at")
    .single();

  if (error) throw new Error("Could not create credits");
  return inserted;
}

export async function deductCredits(
  supabase: SupabaseClient<Database, "public", "public">,
  userId: string,
  kind: CreditKind,
) {
  const cost = COSTS[kind];
  const { data: row } = await supabase
    .from("credits")
    .select("balance, is_paid, exhausted_at")
    .eq("user_id", userId)
    .single();

  let balance = row?.balance ?? 0;
  const isPaid = row?.is_paid ?? false;
  const exhaustedAt = row?.exhausted_at;

  if (balance < cost) {
    if (!isPaid && exhaustedAt && new Date() >= new Date(new Date(exhaustedAt).getTime() + COOLDOWN_MS)) {
      balance = FREE_CREDITS;
    } else {
      throw new Error("Insufficient credits");
    }
  }

  const nextBalance = Math.max(0, balance - cost);
  const nowIso = new Date().toISOString();
  const update: { balance: number; updated_at: string; exhausted_at?: string | null; next_free_at?: string | null; is_paid?: boolean } = {
    balance: nextBalance,
    updated_at: nowIso,
  };
  if (nextBalance === 0 && !isPaid) {
    update.exhausted_at = nowIso;
    update.next_free_at = new Date(Date.now() + COOLDOWN_MS).toISOString();
  }

  const { error } = await supabase.from("credits").update(update).eq("user_id", userId);
  if (error) throw new Error("Could not charge credits");
  return { balance: nextBalance };
}

export async function addCredits(
  supabase: SupabaseClient<Database, "public", "public">,
  userId: string,
  amount: number,
) {
  const { data: row } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
  const newBalance = (row?.balance ?? 0) + amount;
  const { error } = await supabase
    .from("credits")
    .update({ balance: newBalance, is_paid: true, exhausted_at: null, next_free_at: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error("Could not top up credits");
  return { balance: newBalance };
}
