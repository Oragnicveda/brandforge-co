import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCredits, topUpCredits } from "@/lib/credits.functions";

export const FREE_CREDITS = 4;
export const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
export const COSTS = { tokenomics: 1, whitepaper: 2, social: 2, deck: 2, emails: 2, calendar: 2, community: 2, seo: 2, growth: 2 } as const;
export type CreditKind = keyof typeof COSTS;

export const creditsQueryKey = ["credits"] as const;

/**
 * Credits are stored server-side in the Supabase `credits` table, so the
 * balance follows the signed-in user across devices and browsers.
 */
export function useCredits() {
  const fetchCredits = useServerFn(getCredits);
  const topUpFn = useServerFn(topUpCredits);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: creditsQueryKey,
    queryFn: () => fetchCredits(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

  const topUpMutation = useMutation({
    mutationFn: (amount: number) => topUpFn({ data: { amount } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: creditsQueryKey }),
  });

  const credits = data?.balance ?? 0;
  const isPaid = data?.isPaid ?? false;
  const nextFreeAt = data?.nextFreeAt ? new Date(data.nextFreeAt).getTime() : null;

  // Tick so the cooldown countdown stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const msUntilFree = nextFreeAt !== null ? Math.max(0, nextFreeAt - Date.now()) : 0;
  const onCooldown = !isPaid && credits <= 0 && nextFreeAt !== null && msUntilFree > 0;

  const canAfford = (kind: CreditKind) => credits >= COSTS[kind];
  const refresh = () => queryClient.invalidateQueries({ queryKey: creditsQueryKey });
  /** Server deducts on generation; this just resyncs the local view. */
  const charge = (_kind?: CreditKind) => refresh();
  const topUp = (n: number) => topUpMutation.mutate(n);

  return {
    credits,
    max: FREE_CREDITS,
    isPaid,
    canAfford,
    charge,
    topUp,
    refresh,
    costs: COSTS,
    nextFreeAt,
    msUntilFree,
    onCooldown,
    isLoading: data === undefined,
  };
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return "ready";
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
