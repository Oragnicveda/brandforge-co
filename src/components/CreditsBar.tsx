import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useCredits, FREE_CREDITS, formatCooldown } from "@/hooks/use-credits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Coins, Wallet, CheckCircle2, Loader2, ExternalLink, QrCode, Download } from "lucide-react";
import { toast } from "sonner";

// Receiving wallet (EVM — works for ETH on Ethereum, Base, Arbitrum, Polygon, BNB).
const RECEIVER = "0x7C03851b9E2D0C6450D257a7D16A50226C9e34A4";

// Pack pricing in ETH (approx USD-pegged, edit anytime).
const PACKS = [
  { credits: 10, label: "$29",  eth: "0.01"  },
  { credits: 30, label: "$69",  eth: "0.024", badge: "Popular" },
  { credits: 100, label: "$179", eth: "0.062", badge: "Best value" },
];

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  providers?: EthProvider[];
};

declare global {
  interface Window { ethereum?: EthProvider }
}

function pickProvider(kind: "metamask" | "coinbase" | "trust"): EthProvider | null {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const eth = window.ethereum;
  const list: EthProvider[] = eth.providers && eth.providers.length ? eth.providers : [eth];
  const match = list.find((p) =>
    kind === "metamask" ? p.isMetaMask && !p.isCoinbaseWallet && !p.isTrust :
    kind === "coinbase" ? p.isCoinbaseWallet :
    kind === "trust" ? p.isTrust : false
  );
  return match ?? list[0] ?? null;
}

function ethToWeiHex(eth: string): string {
  const [whole, frac = ""] = eth.split(".");
  const padded = (frac + "0".repeat(18)).slice(0, 18);
  const wei = BigInt(whole) * 10n ** 18n + BigInt(padded || "0");
  return "0x" + wei.toString(16);
}

const WALLETS: { id: "metamask" | "coinbase" | "trust"; name: string; hint: string; install: string }[] = [
  { id: "metamask", name: "MetaMask",         hint: "Browser extension or mobile", install: "https://metamask.io/download/" },
  { id: "coinbase", name: "Coinbase Wallet",  hint: "Coinbase Wallet extension",   install: "https://www.coinbase.com/wallet/downloads" },
  { id: "trust",    name: "Trust Wallet",     hint: "Trust browser/mobile",        install: "https://trustwallet.com/download" },
];

function buildDeeplink(kind: "metamask" | "coinbase" | "trust", eth: string): string {
  if (kind === "metamask") return `https://metamask.app.link/send/${RECEIVER}@1?value=${ethToWeiHex(eth)}`;
  if (kind === "trust")    return `https://link.trustwallet.com/send?asset=c60&address=${RECEIVER}&amount=${eth}`;
  return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;
}

export function CreditsBar() {
  const { credits, topUp, onCooldown, msUntilFree } = useCredits();
  const [open, setOpen] = useState(false);
  const low = credits <= 1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`chip ${low ? "chip-primary" : ""}`}
        title={onCooldown ? `Free credits refill in ${formatCooldown(msUntilFree)} — or top up now` : "Click to top up"}
      >
        <Coins className="h-3 w-3" />
        {onCooldown ? `0/${FREE_CREDITS} · free in ${formatCooldown(msUntilFree)}` : `${credits}/${FREE_CREDITS}+ credits`}
      </button>
      <TopUpDialog open={open} onOpenChange={setOpen} onConfirm={(n) => { topUp(n); toast.success(`+${n} credits added`); setOpen(false); }} />
    </>
  );
}

export function TopUpDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (credits: number) => void;
}) {
  const [pack, setPack] = useState(PACKS[1]);
  const [paying, setPaying] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [scan, setScan] = useState<null | "metamask" | "coinbase" | "trust">(null);

  const pay = async (kind: "metamask" | "coinbase" | "trust") => {
    const provider = pickProvider(kind);
    if (!provider) {
      const links: Record<string, string> = {
        metamask: "https://metamask.io/download/",
        coinbase: "https://www.coinbase.com/wallet/downloads",
        trust:    "https://trustwallet.com/download",
      };
      toast.error(`No ${kind} wallet detected — opening install page`);
      window.open(links[kind], "_blank");
      return;
    }
    try {
      setPaying(kind);
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts?.[0];
      if (!from) throw new Error("No account selected");
      const value = ethToWeiHex(pack.eth);
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ from, to: RECEIVER, value }],
      })) as string;
      setTxHash(hash);
      toast.success("Payment sent — credits unlocked");
      onConfirm(pack.credits);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment cancelled";
      toast.error(msg);
    } finally {
      setPaying(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Top up credits</DialogTitle>
          <DialogDescription>Connect your wallet — payment is sent in one click. No copying addresses.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Choose a pack</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {PACKS.map((p) => {
                const active = p.credits === pack.credits;
                return (
                  <button
                    key={p.credits}
                    onClick={() => setPack(p)}
                    className={`rounded-lg border p-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border bg-background/50 hover:border-primary/50"}`}
                  >
                    <div className="text-base font-semibold">{p.credits} credits</div>
                    <div className="text-xs text-muted-foreground">{p.label} · {p.eth} ETH</div>
                    {p.badge && <div className="text-[10px] uppercase tracking-wider text-primary mt-1">{p.badge}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pay {pack.eth} ETH with</Label>
            <div className="grid gap-2">
              {WALLETS.map((w) => {
                const busy = paying === w.id;
                const installed = !!pickProvider(w.id);
                return (
                  <div key={w.id} className="rounded-lg border border-border bg-background/40 p-2 flex items-center gap-2">
                    <button
                      disabled={!!paying}
                      onClick={() => pay(w.id)}
                      className="flex-1 flex items-center justify-between text-left px-2 py-1 disabled:opacity-50"
                    >
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-semibold">{w.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {installed ? "Detected — pay in one click" : "Not detected — scan QR or install"}
                        </span>
                      </span>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => setScan(scan === w.id ? null : w.id)} title="Scan with mobile">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    {!installed && (
                      <a href={w.install} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 pr-2">
                        <Download className="h-3 w-3" /> Install
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {scan && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Scan with {WALLETS.find((w) => w.id === scan)?.name} mobile
                </div>
                <div className="rounded-md bg-white p-3">
                  <QRCodeSVG value={buildDeeplink(scan, pack.eth)} size={168} level="M" />
                </div>
                <div className="text-[11px] text-muted-foreground text-center max-w-xs">
                  Opens the wallet pre-filled with {pack.eth} ETH to the receiver. Confirm in-app to unlock {pack.credits} credits.
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Sends to receiver on whichever EVM network your wallet is currently on (Ethereum, Base, Arbitrum, Polygon, BNB).
            </p>
          </div>

          {txHash && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="truncate flex-1">Tx: <code className="font-mono">{txHash}</code></span>
              <a className="text-primary inline-flex items-center gap-1" href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
