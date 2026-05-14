import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ProjectSetup } from "@/components/ProjectSetup";
import { PhaseTracker } from "@/components/PhaseTracker";
import { TokenomicsPanel } from "@/components/TokenomicsPanel";
import { GenerateCard } from "@/components/GenerateCard";
import { SentimentPanel } from "@/components/SentimentPanel";
import { CreditsBar } from "@/components/CreditsBar";
import { useProject } from "@/hooks/use-project";
import { Lock, ShieldCheck, Hexagon, CalendarCheck, ArrowUpRight, Rocket, Clock, DollarSign, Target, FileCheck2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Blockzia Labs — ICO Launch & Branding AI Co-Pilot" },
      { name: "description", content: "Blockzia Labs: secure AI co-pilot for crypto teams. Tokenomics, whitepaper, social threads, pitch decks, and investor outreach." },
    ],
  }),
});

function Dashboard() {
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
            <span className="chip hidden sm:inline-flex"><Lock className="h-3 w-3" /> Private</span>
            <span className="chip chip-primary hidden md:inline-flex"><ShieldCheck className="h-3 w-3" /> SOC-ready</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="space-y-4">
          <span className="chip chip-primary">2026 · AI Co-Pilot</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Launch your token without a 30-person growth team.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            One brand context — every asset on tap. Tokenomics simulations, whitepapers, threads,
            decks, and investor outreach, generated in seconds and kept on-brand.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="default">
              <a href="https://cal.com/blockzia-kher-group/60min?overlayCalendar=true" target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4" /> Consult an expert
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href="https://blockzia.marketing/" target="_blank" rel="noopener noreferrer">
                Learn more <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

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
          <SentimentPanel />
        </section>

        <footer className="pt-10 pb-6 text-center text-xs text-muted-foreground">
          Encrypted in transit · Audit log available · Role-based access (coming with Cloud)
        </footer>
      </main>
    </div>
  );
}
