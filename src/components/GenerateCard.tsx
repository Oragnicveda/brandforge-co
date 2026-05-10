import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateContent } from "@/lib/generate.functions";
import { useProject } from "@/hooks/use-project";
import { useCredits, type CreditKind } from "@/hooks/use-credits";
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
  calendar: { title: "30-Day Calendar", desc: "Daily community engagement plan across channels.", cta: "Generate calendar" },
};

export function GenerateCard({ kind }: { kind: Kind }) {
  const { project, isReady } = useProject();
  const generate = useServerFn(generateContent);
  const { canAfford, charge, costs, topUp, isPaid } = useCredits();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const cost = costs[kind];

  const run = async () => {
    if (!isReady) { toast.error("Fill in project setup first"); return; }
    if (!canAfford(kind)) { toast.error(`Needs ${cost} credits — top up to continue`); setTopUpOpen(true); return; }
    setLoading(true);
    try {
      const res = await generate({ data: { ...project, kind } });
      if ("text" in res && res.text) { setText(res.text); charge(kind); }
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
    <div className="panel p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold tracking-tight">{m.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">{m.desc}</p>
        </div>
        <Button onClick={run} disabled={loading} variant="default" className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {m.cta} <span className="ml-1 inline-flex items-center gap-1 text-[10px] opacity-80"><Coins className="h-3 w-3" />{cost}</span>
        </Button>
      </div>
      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onConfirm={(n) => { topUp(n); setTopUpOpen(false); toast.success(`+${n} credits added`); }} />

      {text && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
            <Button size="sm" variant="secondary" onClick={exportMd}><Download className="h-3.5 w-3.5" /> Markdown</Button>
            <Button size="sm" variant="secondary" onClick={exportPdf}><Download className="h-3.5 w-3.5" /> PDF</Button>
            <Button size="sm" variant="ghost" onClick={() => { window.open(`https://www.notion.so/`, "_blank"); navigator.clipboard.writeText(text); toast.success("Copied — paste into Notion"); }}>
              Notion
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied — paste into Slack"); }}>
              Slack
            </Button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border bg-background/40 p-5 max-h-[480px] overflow-auto">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}
