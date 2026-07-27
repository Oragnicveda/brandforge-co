import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FREE_CREDITS = 4;
export const COOLDOWN_MS = 12 * 60 * 60 * 1000;
export const COSTS = { tokenomics: 1, whitepaper: 2, social: 2, deck: 2, emails: 2, calendar: 2 } as const;
export type CreditKind = keyof typeof COSTS;

const KindSchema = z.enum(["tokenomics", "whitepaper", "social", "deck", "emails", "calendar"]);

export const getCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;

    const { data: row, error } = await supabase
      .from("credits")
      .select("balance, is_paid, exhausted_at, next_free_at")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("getCredits error", error);
      throw new Error("Could not read credits");
    }

    let balance = row?.balance ?? 0;
    let isPaid = row?.is_paid ?? false;
    let nextFreeAt: string | null = row?.next_free_at ?? null;

    // Auto-refill free credits after 12 hours
    if (!isPaid && balance <= 0 && nextFreeAt && new Date() >= new Date(nextFreeAt)) {
      balance = FREE_CREDITS;
      nextFreeAt = null;
      const { error: upd } = await supabase
        .from("credits")
        .update({ balance, next_free_at: null, exhausted_at: null })
        .eq("user_id", userId);
      if (upd) {
        console.error("refill error", upd);
        throw new Error("Could not refill credits");
      }
    }

    return { balance, isPaid, nextFreeAt, costs: COSTS };
  });

export const chargeCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ kind: KindSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    const cost = COSTS[data.kind];

    const { data: row } = await supabase
      .from("credits")
      .select("balance, is_paid, exhausted_at")
      .eq("user_id", userId)
      .single();

    let balance = row?.balance ?? 0;
    const isPaid = row?.is_paid ?? false;
    const exhaustedAt = row?.exhausted_at;

    if (balance < cost) {
      // Try auto-refill first
      if (!isPaid && exhaustedAt && new Date() >= new Date(new Date(exhaustedAt).getTime() + COOLDOWN_MS)) {
        balance = FREE_CREDITS;
      } else {
        throw new Error("Insufficient credits");
      }
    }

    const nextBalance = Math.max(0, balance - cost);
    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = { balance: nextBalance, updated_at: nowIso };
    if (nextBalance === 0 && !isPaid) {
      update.exhausted_at = nowIso;
      update.next_free_at = new Date(Date.now() + COOLDOWN_MS).toISOString();
    }
    if (balance === FREE_CREDITS && nextBalance < FREE_CREDITS) {
      // just started consuming free credits, not paid yet
      update.is_paid = false;
    }

    const { error } = await supabase.from("credits").update(update).eq("user_id", userId);
    if (error) {
      console.error("chargeCredits error", error);
      throw new Error("Could not charge credits");
    }

    return { balance: nextBalance };
  });

export const topUpCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    const { data: row } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (row?.balance ?? 0) + data.amount;
    const { error } = await supabase
      .from("credits")
      .update({ balance: newBalance, is_paid: true, exhausted_at: null, next_free_at: null, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      console.error("topUpCredits error", error);
      throw new Error("Could not top up credits");
    }
    return { balance: newBalance };
  });
