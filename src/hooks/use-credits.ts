import { useEffect, useState } from "react";

const KEY = "blockzia-credits";
const PAID_KEY = "blockzia-paid";
const EXHAUSTED_KEY = "blockzia-exhausted-at";
const EVT = "blockzia-credits-change";
export const FREE_CREDITS = 4;
export const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
export const COSTS = { tokenomics: 1, whitepaper: 2, social: 2, deck: 2, emails: 2, calendar: 2 } as const;
export type CreditKind = keyof typeof COSTS;

function readRaw(): number {
  if (typeof window === "undefined") return FREE_CREDITS;
  const raw = localStorage.getItem(KEY);
  if (raw === null) return FREE_CREDITS;
  const n = Number(raw);
  return Number.isFinite(n) ? n : FREE_CREDITS;
}
function readExhaustedAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(EXHAUSTED_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function writeExhaustedAt(ts: number | null) {
  if (ts === null) localStorage.removeItem(EXHAUSTED_KEY);
  else localStorage.setItem(EXHAUSTED_KEY, String(ts));
}
/** Auto-refill free credits if cooldown elapsed. Returns current credits. */
function read(): number {
  if (typeof window === "undefined") return FREE_CREDITS;
  const credits = readRaw();
  const paid = readPaid();
  const exhaustedAt = readExhaustedAt();
  if (!paid && credits <= 0 && exhaustedAt !== null && Date.now() - exhaustedAt >= COOLDOWN_MS) {
    localStorage.setItem(KEY, String(FREE_CREDITS));
    writeExhaustedAt(null);
    return FREE_CREDITS;
  }
  return credits;
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
  const [nextFreeAt, setNextFreeAt] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      setCredits(read());
      setIsPaid(readPaid());
      const ex = readExhaustedAt();
      setNextFreeAt(ex !== null ? ex + COOLDOWN_MS : null);
    };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    // Tick every 30s so countdown + auto-refill stay fresh.
    const id = window.setInterval(sync, 30_000);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
      window.clearInterval(id);
    };
  }, []);

  const canAfford = (kind: CreditKind) => read() >= COSTS[kind];
  const charge = (kind: CreditKind) => {
    const cost = COSTS[kind];
    const next = Math.max(0, read() - cost);
    write(next);
    if (next === 0 && !readPaid() && readExhaustedAt() === null) {
      writeExhaustedAt(Date.now());
      window.dispatchEvent(new Event(EVT));
    }
    return next;
  };
  const topUp = (n: number) => {
    write(readRaw() + n);
    writePaid(true);
    writeExhaustedAt(null);
    window.dispatchEvent(new Event(EVT));
  };
  const reset = () => {
    write(FREE_CREDITS);
    writePaid(false);
    writeExhaustedAt(null);
    window.dispatchEvent(new Event(EVT));
  };

  const msUntilFree = nextFreeAt !== null ? Math.max(0, nextFreeAt - Date.now()) : 0;
  const onCooldown = !isPaid && credits <= 0 && nextFreeAt !== null && msUntilFree > 0;

  return { credits, max: FREE_CREDITS, isPaid, canAfford, charge, topUp, reset, costs: COSTS, nextFreeAt, msUntilFree, onCooldown };
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return "ready";
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
