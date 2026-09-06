import { Toaster } from "@/components/ui/sonner";
import { ProjectSetup } from "@/components/ProjectSetup";
import { PhaseTracker } from "@/components/PhaseTracker";
import { TokenomicsPanel } from "@/components/TokenomicsPanel";
import { GenerateCard } from "@/components/GenerateCard";
import { SentimentPanel } from "@/components/SentimentPanel";
import { CreditsBar } from "@/components/CreditsBar";
import { AccountMenu } from "@/components/AccountMenu";
import { useProject } from "@/hooks/use-project";
import { Hexagon, Sparkles, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const { isReady, project } = useProject();

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-x-0 top-0 h-[420px] grid-bg pointer-events-none opacity-40" />
      <Toaster theme="dark" position="top-right" />

      <header className="relative border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg grid place-items-center" style={{ background: "var(--gradient-violet)" }}>
              <Hexagon className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold tracking-tight leading-none truncate">Blockzia Labs</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5 truncate">Launch · Brand · Comply</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CreditsBar />
            <span className="chip hidden lg:inline-flex"><Sparkles className="h-3 w-3" /> Beta · 20 founding teams</span>
            <span className="chip chip-primary hidden xl:inline-flex"><ShieldCheck className="h-3 w-3" /> SOC-ready</span>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <PhaseTracker done={{
          setup: isReady,
          tokenomics: false,
          whitepaper: false,
          marketing: false,
          launch: false,
        }} />

        <section id="setup"><ProjectSetup /></section>

        {project.name && (
          <section className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active project</div>
            <div className="text-2xl font-semibold tracking-tight">{project.name}</div>
          </section>
        )}

        <section><TokenomicsPanel /></section>

        <section className="grid lg:grid-cols-2 gap-6">
          <GenerateCard kind="whitepaper" />
          <GenerateCard kind="social" />
          <GenerateCard kind="deck" />
          <GenerateCard kind="emails" />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <GenerateCard kind="calendar" />
          <GenerateCard kind="community" />
          <GenerateCard kind="seo" />
          <GenerateCard kind="growth" />
          <SentimentPanel />
        </section>

        <footer className="pt-10 pb-6 text-center text-xs text-muted-foreground">
          Encrypted in transit · Audit log available · Role-based access enabled
        </footer>
      </main>
    </div>
  );
}
