import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateContent } from "@/lib/generate.functions";
import { useProject } from "@/hooks/use-project";
import { useCredits, type CreditKind } from "@/hooks/use-credits";
import { formatCooldown } from "@/hooks/use-credits";
import { TopUpDialog } from "@/components/CreditsBar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import { Download, Loader2, Sparkles, FileText, Copy, Coins, Lock } from "lucide-react";

type Kind = Exclude<CreditKind, "tokenomics">;

const meta: Record<Kind, { title: string; desc: string; cta: string }> = {
  whitepaper: { title: "Whitepaper", desc: "Comprehensive ICO whitepaper with tokenomics, roadmap & legal disclaimer.", cta: "Generate whitepaper" },
  social: { title: "Social Threads", desc: "On-brand X thread, Telegram announcement & Discord post.", cta: "Generate threads" },
  deck: { title: "Pitch Deck", desc: "10-slide investor deck with copy + image prompts.", cta: "Generate deck" },
  emails: { title: "Investor Outreach", desc: "Cold email, follow-up & a curated VC target list.", cta: "Generate outreach" },
  community: { title: "Community Agent", desc: "7 days of ready-to-post Telegram, Discord, Reddit & X copy engineered to grow your community.", cta: "Generate 7-day plan" },
  seo: { title: "SEO Agent", desc: "Full tailored SEO plan: keyword clusters with volume/difficulty, technical audit, content calendar, backlinks & KPIs.", cta: "Generate SEO plan" },
  growth: { title: "Growth Intelligence Agent", desc: "Analyses growth patterns from comparable projects, picks optimal timing for airdrops, AMAs & partnerships, predicts which community segments respond to each incentive, and auto-segments audiences for growth experiments.", cta: "Generate growth plan" },
  calendar: { title: "Launch Week Calendar", desc: "7-day crypto-native launch plan with real channel links, on-chain CTAs & asset checklist.", cta: "Generate week plan" },
};

export function GenerateCard({ kind }: { kind: Kind }) {
  const { project, isReady } = useProject();
  const generate = useServerFn(generateContent);
  const { canAfford, refresh, costs, topUp, isPaid, onCooldown, msUntilFree } = useCredits();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const cost = costs[kind];

  const run = async () => {
    if (!isReady) { toast.error("Fill in project setup first"); return; }
    if (!canAfford(kind)) {
      if (onCooldown) toast.error(`Free credits refill in ${formatCooldown(msUntilFree)} — or top up to continue now`);
      else toast.error(`Needs ${cost} credits — top up to continue`);
      setTopUpOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await generate({ data: { ...project, kind } });
      if (typeof res.content === "string") { setText(res.content); }
      refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(`${project.name} — ${meta[kind].title}`, margin, 60);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, width);
    let y = 90;
    const ph = doc.internal.pageSize.getHeight() - margin;
    for (const ln of lines) {
      if (y > ph) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y); y += 14;
    }
    doc.save(`${project.name}-${kind}.pdf`);
  };

  const exportMd = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.name}-${kind}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const m = meta[kind];

  return (
    <div className="panel p-6 flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold tracking-tight">{m.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">{m.desc}</p>
        </div>
        <Button onClick={run} disabled={loading} variant="default" className="shrink-0 w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {m.cta} <span className="ml-1 inline-flex items-center gap-1 text-[10px] opacity-80"><Coins className="h-3 w-3" />{cost}</span>
        </Button>
      </div>
      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onConfirm={(n) => { topUp(n); setTopUpOpen(false); toast.success(`+${n} credits added`); }} />

      {text && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="sm" variant="secondary" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
            {isPaid ? (
              <>
                <Button size="sm" variant="secondary" onClick={exportMd}><Download className="h-3.5 w-3.5" /> Markdown</Button>
                <Button size="sm" variant="secondary" onClick={exportPdf}><Download className="h-3.5 w-3.5" /> PDF</Button>
              </>
            ) : (
              <Button size="sm" variant="default" onClick={() => setTopUpOpen(true)}>
                <Lock className="h-3.5 w-3.5" /> Unlock downloads
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied — paste into Slack"); }}>
              Slack
            </Button>
            {!isPaid && <span className="text-[11px] text-muted-foreground ml-auto">Top up to export PDF / Markdown</span>}
          </div>
          <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border bg-background/40 p-6 max-h-[520px] overflow-auto
            prose-headings:tracking-tight prose-headings:text-foreground
            prose-h1:text-2xl prose-h1:mt-0 prose-h1:mb-4 prose-h1:border-b prose-h1:border-border prose-h1:pb-2
            prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-primary
            prose-p:leading-relaxed prose-p:text-foreground/90
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:text-foreground/90
            prose-table:text-xs prose-table:border prose-table:border-border
            prose-th:bg-muted/40 prose-th:text-foreground prose-th:px-3 prose-th:py-2 prose-th:text-left
            prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border
            prose-code:text-primary prose-code:bg-muted/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
            prose-hr:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}
