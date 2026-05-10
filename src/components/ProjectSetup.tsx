import { useProject, type Project } from "@/hooks/use-project";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Save, Rocket } from "lucide-react";

export function ProjectSetup() {
  const { project, setProject, loaded } = useProject();
  const [draft, setDraft] = useState<Project>(project);
  useEffect(() => { if (loaded) setDraft(project); }, [loaded, project]);

  const update = (k: keyof Project, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const save = () => {
    if (!draft.name || !draft.mission) { toast.error("Name and mission are required"); return; }
    setProject(draft); toast.success("Project saved — co-pilot is ready");
  };

  return (
    <div className="panel p-6">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-semibold tracking-tight">Project Setup</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Fill once. Brand voice + context flow into every generated asset.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Helix Protocol" className="bg-background/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audience">Target audience</Label>
          <Input id="audience" value={draft.audience} onChange={(e) => update("audience", e.target.value)} placeholder="DeFi-native VCs, retail traders in EU/APAC" className="bg-background/50" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="mission">Mission statement</Label>
          <Textarea id="mission" value={draft.mission} onChange={(e) => update("mission", e.target.value)} placeholder="What problem are you solving and for whom?" className="bg-background/50 min-h-[88px]" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="token">Token details</Label>
          <Textarea id="token" value={draft.token} onChange={(e) => update("token", e.target.value)} placeholder="Symbol, total supply, utility, chain, sale type, target raise..." className="bg-background/50 min-h-[88px]" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="brand">Brand voice & guidelines</Label>
          <Textarea id="brand" value={draft.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Tone (e.g. confident, technical, witty), banned words, key phrases, visual identity notes..." className="bg-background/50 min-h-[100px]" />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save}><Save className="h-4 w-4" /> Save context</Button>
      </div>
    </div>
  );
}
