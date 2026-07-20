import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ProjectSetup } from "@/components/ProjectSetup";
import { PhaseTracker } from "@/components/PhaseTracker";
import { TokenomicsPanel } from "@/components/TokenomicsPanel";
import { GenerateCard } from "@/components/GenerateCard";
import { SentimentPanel } from "@/components/SentimentPanel";
import { CreditsBar } from "@/components/CreditsBar";
import { useProject } from "@/hooks/use-project";
import { Sparkles, ShieldCheck, Hexagon, CalendarCheck, ArrowUpRight, Rocket, Clock, DollarSign, Target, FileCheck2, TrendingUp, Check, Star, Quote, FileText, PieChart, MessageSquare } from "lucide-react";
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
            <span className="chip hidden sm:inline-flex"><Sparkles className="h-3 w-3" /> Beta · 20 founding teams</span>
            <span className="chip chip-primary hidden md:inline-flex"><ShieldCheck className="h-3 w-3" /> SOC-ready</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Bull cycle window closing — 2026</span>
            <span className="chip">87% of tokens fail in their first 90 days</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl leading-[1.05]">
            Welcome to the next era of crypto intelligence. 🚀
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed">
            Every week you spend chasing a copywriter, tokenomics consultant, deck designer, and IR analyst is a week the narrative moves on without you — liquidity dries up, KOLs lose interest, the listing window slips.
            <span className="block mt-3 text-foreground">
              Blockzia compresses an <strong>$80k+ agency stack</strong> into one AI co-pilot. Whitepaper, tokenomics, decks, threads, and investor emails — generated from a single brand context, on-brand across every channel, ready to ship in an afternoon.
            </span>
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild variant="default" size="lg">
              <a href="https://cal.com/blockzia-kher-group/60min?overlayCalendar=true" target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4" /> Claim your launch slot
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="https://blockzia.marketing/" target="_blank" rel="noopener noreferrer">
                See what's inside <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">No agency retainers · No 6-week timelines · Cancel anytime</p>
        </section>

        <section aria-labelledby="benefits-heading" className="space-y-6">
          <h2 id="benefits-heading" className="sr-only">Outcomes for crypto teams</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, metric: "10x faster", title: "Launch in days, not quarters", desc: "Whitepaper, tokenomics, deck, threads, and outreach generated from one brand context — ship a full launch kit in a single afternoon." },
              { icon: DollarSign, metric: "$80k+ saved", title: "Replace the agency stack", desc: "One co-pilot covers what a copywriter, tokenomics consultant, deck designer, and IR analyst used to bill for — keep treasury runway for product and liquidity." },
              { icon: Target, metric: "On-brand, every asset", title: "Zero voice drift across channels", desc: "Brand voice, mission, audience, and ticker stay locked across X threads, Telegram, Discord, decks, and investor emails — no rogue community manager copy." },
              { icon: TrendingUp, metric: "Investor-ready", title: "Pitch decks VCs actually open", desc: "10-slide decks calibrated to your stage and raise size, with speaker notes and a use-of-funds split — built for warm intros, not cold spam." },
              { icon: FileCheck2, metric: "Audit-friendly", title: "Tokenomics that survive due diligence", desc: "Allocations sum to 100%, vesting matches your stage, and the 24-month emission curve respects your max supply — defensible in any data room." },
              { icon: Rocket, metric: "7-day launch week", title: "Community calendar that converts", desc: "Crypto-native, channel-specific posts with real CTAs and on-chain links — engineered for points campaigns, AMAs, and listing-day momentum." },
            ].map(({ icon: Icon, metric, title, desc }) => (
              <article key={title} className="panel p-5 group hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: "var(--gradient-violet)" }}>
                    <Icon className="h-5 w-5 text-background" strokeWidth={2.25} />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">{metric}</span>
                </div>
                <h3 className="font-semibold tracking-tight mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </article>
            ))}
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
