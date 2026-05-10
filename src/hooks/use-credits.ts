import { useEffect, useState } from "react";

const KEY = "blockzia-credits";
const EVT = "blockzia-credits-change";
export const FREE_CREDITS = 4;
export const COSTS = { tokenomics: 1, whitepaper: 2, social: 2, deck: 2, emails: 2, calendar: 2 } as const;
export type CreditKind = keyof typeof COSTS;

function read(): number {
  if (typeof window === "undefined") return FREE_CREDITS;
  const raw = localStorage.getItem(KEY);
  if (raw === null) return FREE_CREDITS;
  const n = Number(raw);
  return Number.isFinite(n) ? n : FREE_CREDITS;
}

function write(n: number) {
  localStorage.setItem(KEY, String(n));
  window.dispatchEvent(new Event(EVT));
}

export function useCredits() {
  const [credits, setCredits] = useState<number>(FREE_CREDITS);
  useEffect(() => {
    setCredits(read());
    const sync = () => setCredits(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const canAfford = (kind: CreditKind) => credits >= COSTS[kind];
  const charge = (kind: CreditKind) => {
    const cost = COSTS[kind];
    const next = Math.max(0, read() - cost);
    write(next);
    return next;
  };
  const topUp = (n: number) => write(read() + n);
  const reset = () => write(FREE_CREDITS);

  return { credits, max: FREE_CREDITS, canAfford, charge, topUp, reset, costs: COSTS };
}
