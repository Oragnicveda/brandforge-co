import { useProject, type Project } from "@/hooks/use-project";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Send, UserPlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";

const ROLES = ["Founder / CEO", "CMO / Head of Marketing", "Community Lead", "Legal / Compliance", "Investor Relations", "Other"];
const STAGES = ["Pre-seed / Idea", "Private sale", "Public sale / IDO prep", "Post-launch growth"];
const CHAINS = ["Ethereum", "Solana", "Base", "Arbitrum", "BNB Chain", "Polygon", "Sui", "TON", "Other"];
const RAISE = ["< $500K", "$500K – $2M", "$2M – $10M", "$10M – $50M", "$50M+"];
const AUDIENCES = ["DeFi-native traders", "Institutional / VC", "Retail (global)", "Gaming & NFT community", "Enterprise / B2B", "Mixed"];

export function ProjectSetup() {
  const { project, setProject, loaded } = useProject();
  const [draft, setDraft] = useState<Project>(project);
  useEffect(() => { if (loaded) setDraft(project); }, [loaded, project]);

  const update = <K extends keyof Project>(k: K, v: Project[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const sendLead = useServerFn(submitLead);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!draft.fullName || !draft.workEmail) return toast.error("Name and work email required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.workEmail)) return toast.error("Enter a valid work email");
    if (!draft.name || !draft.mission) return toast.error("Project name and mission required");
    setSubmitting(true);
    try {
      await setProject(draft);
      try {
        await sendLead({ data: {
          fullName: draft.fullName,
          workEmail: draft.workEmail,
          company: draft.company || "",
          role: draft.role || "",
          name: draft.name,
          stage: draft.stage || "",
          chain: draft.chain || "",
          raiseSize: draft.raiseSize || "",
          audience: draft.audience || "",
          token: draft.token || "",
          maxSupply: draft.maxSupply || "",
          mission: draft.mission,
          brand: draft.brand || "",
        }});
      } catch (e) {
        console.error("lead email failed", e);
      }
      toast.success("Project saved — co-pilot is ready");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not save project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel p-6">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-semibold tracking-tight">Get your launch co-pilot</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Tell us about you and your token. We'll calibrate the AI to your brand voice and stage in seconds.
      </p>

      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">About you</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input value={draft.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Ada Lovelace" className="bg-background/50" />
            </Field>
            <Field label="Work email" required>
              <Input type="email" value={draft.workEmail} onChange={(e) => update("workEmail", e.target.value)} placeholder="ada@helix.xyz" className="bg-background/50" />
            </Field>
            <Field label="Company">
              <Input value={draft.company} onChange={(e) => update("company", e.target.value)} placeholder="Helix Labs" className="bg-background/50" />
            </Field>
            <Field label="Your role">
              <SelectField value={draft.role} onChange={(v) => update("role", v)} placeholder="Select role" options={ROLES} />
            </Field>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Project context</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Project name" required>
              <Input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Helix Protocol" className="bg-background/50" />
            </Field>
            <Field label="Launch stage">
              <SelectField value={draft.stage} onChange={(v) => update("stage", v)} placeholder="Select stage" options={STAGES} />
            </Field>
            <Field label="Primary chain">
              <SelectField value={draft.chain} onChange={(v) => update("chain", v)} placeholder="Select chain" options={CHAINS} />
            </Field>
            <Field label="Target raise">
              <SelectField value={draft.raiseSize} onChange={(v) => update("raiseSize", v)} placeholder="Select range" options={RAISE} />
            </Field>
            <Field label="Target audience">
              <SelectField value={draft.audience} onChange={(v) => update("audience", v)} placeholder="Select audience" options={AUDIENCES} />
            </Field>
            <Field label="Token symbol & utility">
              <Input value={draft.token} onChange={(e) => update("token", e.target.value)} placeholder="$HLX — governance + fee share" className="bg-background/50" />
            </Field>
            <Field label="Max token supply">
              <Input value={draft.maxSupply} onChange={(e) => update("maxSupply", e.target.value)} placeholder="1,000,000,000 HLX" className="bg-background/50" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Mission statement" required>
                <Textarea value={draft.mission} onChange={(e) => update("mission", e.target.value)} placeholder="What problem are you solving and for whom?" className="bg-background/50 min-h-[88px]" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Brand voice & guidelines">
                <Textarea value={draft.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Tone (confident, technical, witty), banned words, key phrases, visual identity notes..." className="bg-background/50 min-h-[88px]" />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">By submitting you agree to our private workspace terms. Data is encrypted in transit.</p>
        <Button onClick={submit} disabled={submitting} className="shrink-0"><Send className="h-4 w-4" /> {submitting ? "Sending…" : "Submit & activate"}</Button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-primary"> *</span>}</Label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="bg-background/50"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
