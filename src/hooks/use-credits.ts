import { useEffect, useState } from "react";

const KEY = "blockzia-credits";
const PAID_KEY = "blockzia-paid";
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
function readPaid(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PAID_KEY) === "1";
}
function write(n: number) {
  localStorage.setItem(KEY, String(n));
  window.dispatchEvent(new Event(EVT));
}
function writePaid(v: boolean) {
  localStorage.setItem(PAID_KEY, v ? "1" : "0");
  window.dispatchEvent(new Event(EVT));
}

export function useCredits() {
  const [credits, setCredits] = useState<number>(FREE_CREDITS);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  useEffect(() => {
    setCredits(read());
    setIsPaid(readPaid());
    const sync = () => { setCredits(read()); setIsPaid(readPaid()); };
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
  const topUp = (n: number) => { write(read() + n); writePaid(true); };
  const reset = () => { write(FREE_CREDITS); writePaid(false); };

  return { credits, max: FREE_CREDITS, isPaid, canAfford, charge, topUp, reset, costs: COSTS };
}
