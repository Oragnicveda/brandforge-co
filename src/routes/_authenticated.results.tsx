import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { AccountMenu } from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Copy, Download, FileText, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/results")({
  component: ResultsPage,
  head: () => ({
    meta: [
      { title: "My Results — Blockzia Labs" },
      { name: "description", content: "Every whitepaper, tokenomics model, SEO plan and campaign the co-pilot has generated for your project." },
      { property: "og:title", content: "My Results — Blockzia Labs" },
      { property: "og:description", content: "Every whitepaper, tokenomics model, SEO plan and campaign the co-pilot has generated for your project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const LABELS: Record<string, string> = {
  whitepaper: "Whitepaper",
  social: "Social Threads",
  deck: "Pitch Deck",
  emails: "Investor Outreach",
  tokenomics: "Tokenomics",
  calendar: "Launch Week Calendar",
  community: "Community Plan",
  seo: "SEO Plan",
  sentiment: "Sentiment Check",
};

type Item = { id: string; kind: string; created_at: string; content: unknown };

function toText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const c = content as Record<string, unknown>;
    if (typeof c.text === "string") return c.text;
    if (typeof c.content === "string") return c.content;
  }
  return "```json\n" + JSON.stringify(content, null, 2) + "\n```";
}

function ResultCard({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => toText(item.content), [item.content]);
  const title = LABELS[item.kind] ?? item.kind;

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, width);
    let y = 90;
    const ph = doc.internal.pageSize.getHeight() - margin;
    for (const ln of lines) {
      if (y > ph) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += 14;
    }
    doc.save(`${item.kind}-${item.id.slice(0, 6)}.pdf`);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="font-medium truncate">{title}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border/60 p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={exportPdf}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("generations")
        .select("id, kind, created_at, content")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) toast.error("Could not load your results");
      setItems((data ?? []) as Item[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-right" />
      <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2">
          <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My results</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything the co-pilot has produced for you, saved and ready to re-open or export.</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your results…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/50 p-8 text-center space-y-3">
            <div className="text-sm text-muted-foreground">Nothing saved yet — generate your first asset and it will appear here.</div>
            <Button asChild size="sm"><Link to="/app">Go to dashboard</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => <ResultCard key={it.id} item={it} />)}
          </div>
        )}
      </main>
    </div>
  );
}
