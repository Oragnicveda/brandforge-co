import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FREE_CREDITS, COOLDOWN_MS, COSTS, getOrCreateCredits, deductCredits, addCredits } from "@/lib/credits.server";

export { FREE_CREDITS, COOLDOWN_MS, COSTS };
export type CreditKind = keyof typeof COSTS;

const KindSchema = z.enum(["tokenomics", "whitepaper", "social", "deck", "emails", "calendar"]);

export const getCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    let row = await getOrCreateCredits(supabase, userId);

    let balance = row.balance;
    let isPaid = row.is_paid;
    let nextFreeAt: string | null = row.next_free_at;

    if (!isPaid && balance <= 0 && nextFreeAt && new Date() >= new Date(nextFreeAt)) {
      balance = FREE_CREDITS;
      nextFreeAt = null;
      const { error } = await supabase
        .from("credits")
        .update({ balance, next_free_at: null, exhausted_at: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw new Error("Could not refill credits");
    }

    return { balance, isPaid, nextFreeAt, costs: COSTS };
  });

export const chargeCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ kind: KindSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    return deductCredits(supabase, userId, data.kind);
  });

export const topUpCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    return addCredits(supabase, userId, data.amount);
  });
