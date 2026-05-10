import { useState } from "react";
import { useCredits, FREE_CREDITS } from "@/hooks/use-credits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Copy, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Receiving wallet addresses — replace with your real addresses.
const WALLETS = [
  { chain: "Ethereum / Base / Arbitrum (USDC, ETH)", address: "0xYOUR_ETH_ADDRESS_HERE" },
  { chain: "Solana (USDC, SOL)", address: "YOUR_SOLANA_ADDRESS_HERE" },
  { chain: "Bitcoin", address: "bc1YOUR_BTC_ADDRESS_HERE" },
];

const PACKS = [
  { credits: 10, price: "$29" },
  { credits: 30, price: "$69", badge: "Popular" },
  { credits: 100, price: "$179", badge: "Best value" },
];

export function CreditsBar() {
  const { credits, topUp } = useCredits();
  const [open, setOpen] = useState(false);
  const low = credits <= 1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`chip ${low ? "chip-primary" : ""}`}
        title="Click to top up via wallet"
      >
        <Coins className="h-3 w-3" />
        {credits}/{FREE_CREDITS}+ credits
      </button>

      <TopUpDialog open={open} onOpenChange={setOpen} onConfirm={(n) => { topUp(n); toast.success(`+${n} credits added`); setOpen(false); }} />
    </>
  );
}

export function TopUpDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (credits: number) => void;
}) {
  const [pack, setPack] = useState(PACKS[1]);
  const [txHash, setTxHash] = useState("");

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Address copied"); };

  const confirm = () => {
    if (txHash.trim().length < 8) return toast.error("Paste your transaction hash to confirm payment");
    onConfirm(pack.credits);
    setTxHash("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Top up credits</DialogTitle>
          <DialogDescription>Pay to a wallet below, then paste your transaction hash. Credits unlock instantly.</DialogDescription>
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
                    <div className="text-xs text-muted-foreground">{p.price}</div>
                    {p.badge && <div className="text-[10px] uppercase tracking-wider text-primary mt-1">{p.badge}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Send {pack.price} to any wallet</Label>
            {WALLETS.map((w) => (
              <div key={w.chain} className="rounded-lg border border-border bg-background/50 p-3">
                <div className="text-xs text-muted-foreground mb-1">{w.chain}</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">{w.address}</code>
                  <Button size="sm" variant="secondary" onClick={() => copy(w.address)}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="tx" className="text-xs">Transaction hash</Label>
            <Input id="tx" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x... or signature" className="bg-background/50 mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm}><CheckCircle2 className="h-4 w-4" /> I've paid — unlock {pack.credits} credits</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
