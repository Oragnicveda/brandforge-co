import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateContent } from "@/lib/generate.functions";
import { useProject } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

type S = { score: number; label: "bearish" | "neutral" | "bullish"; risks: string[]; suggestions: string[] };

export function SentimentPanel() {
  const { project } = useProject();
  const generate = useServerFn(generateContent);
  const [post, setPost] = useState("");
  const [data, setData] = useState<S | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!post.trim()) { toast.error("Paste a post to analyze"); return; }
    setLoading(true);
    try {
      const res = await generate({ data: { ...project, name: project.name || "x", mission: project.mission || "x", audience: project.audience || "x", token: project.token || "x", kind: "sentiment", extra: post } });
      if ("data" in res && res.kind === "sentiment") setData(res.data as S);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const color = data?.label === "bullish" ? "text-success" : data?.label === "bearish" ? "text-destructive" : "text-warning";

  return (
    <div className="panel p-6">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-semibold tracking-tight">Real-time Sentiment</h3>
      </div>
      <Textarea placeholder="Paste a generated post or draft tweet..." value={post} onChange={(e) => setPost(e.target.value)} className="min-h-[100px] bg-background/50" />
      <Button onClick={run} disabled={loading} className="mt-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        Analyze
      </Button>

      {data && (
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
            <div className={`text-3xl font-bold mt-1 ${color}`}>{data.score.toFixed(2)}</div>
            <div className={`text-xs uppercase tracking-wider mt-1 ${color}`}>{data.label}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Risks</div>
            <ul className="space-y-1 text-sm">{data.risks.map((r, i) => <li key={i}>• {r}</li>)}</ul>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Suggestions</div>
            <ul className="space-y-1 text-sm">{data.suggestions.map((r, i) => <li key={i}>• {r}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
