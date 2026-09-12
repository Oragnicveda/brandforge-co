import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateContent } from "@/lib/generate.functions";
import { PROJECT_CHANGE_EVENT, useProject } from "@/hooks/use-project";
import { useCredits } from "@/hooks/use-credits";
import { TopUpDialog } from "@/components/CreditsBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PieChart as PieIcon, TrendingUp, Coins } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

type Token = {
  allocations: { category: string; percent: number; vestingMonths: number }[];
  emissions: { month: number; circulating: number }[];
  summary: string;
};

const COLORS = ["oklch(0.78 0.18 155)", "oklch(0.7 0.18 285)", "oklch(0.78 0.15 220)", "oklch(0.82 0.17 80)", "oklch(0.7 0.2 350)", "oklch(0.65 0.15 200)", "oklch(0.75 0.2 50)"];

export function TokenomicsPanel() {
  const { project, isReady } = useProject();
  const generate = useServerFn(generateContent);
  const { canAfford, refresh, costs, topUp } = useCredits();
  const [data, setData] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const run = async () => {
    if (!isReady) { toast.error("Fill in project setup first"); return; }
    if (!canAfford("tokenomics")) { toast.error("Out of credits — top up to continue"); setTopUpOpen(true); return; }
    setLoading(true);
    try {
      const res = await generate({ data: { ...project, kind: "tokenomics" } });
      if (res.kind === "tokenomics" && typeof res.content === "object" && res.content !== null) { setData(res.content as unknown as Token); }
      window.dispatchEvent(new Event(PROJECT_CHANGE_EVENT));
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold tracking-tight">Tokenomics Model</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">AI-simulated allocations & 24-month emission curve.</p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          Simulate <span className="ml-1 inline-flex items-center gap-1 text-[10px] opacity-80"><Coins className="h-3 w-3" />{costs.tokenomics}</span>
        </Button>
      </div>
      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onConfirm={(n) => { topUp(n); setTopUpOpen(false); toast.success(`+${n} credits added`); }} />

      {data ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Token allocation</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.allocations} dataKey="percent" nameKey="category" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {data.allocations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.2 0.025 262)", border: "1px solid oklch(0.3 0.02 262)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {data.allocations.map((a, i) => (
                <div key={a.category} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-foreground">{a.category}</span>
                  <span className="text-muted-foreground ml-auto">{a.percent}% · {a.vestingMonths}mo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Circulating supply (M)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.emissions}>
                <defs>
                  <linearGradient id="emit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.3 0.02 262 / 50%)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="oklch(0.68 0.025 258)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.025 258)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.2 0.025 262)", border: "1px solid oklch(0.3 0.02 262)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="circulating" stroke="oklch(0.78 0.18 155)" strokeWidth={2} fill="url(#emit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 rounded-lg border border-border bg-background/40 p-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Strategist summary</h4>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border h-48 grid place-items-center text-sm text-muted-foreground">
          Run a simulation to see your tokenomics breakdown
        </div>
      )}
    </div>
  );
}
