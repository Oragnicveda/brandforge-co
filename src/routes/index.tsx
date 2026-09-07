import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Hexagon, CalendarCheck, ArrowUpRight, Clock, DollarSign, Target, FileCheck2, TrendingUp, Rocket, Check, Star, Quote, FileText, PieChart, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Blockzia Labs — ICO Launch & Branding AI Co-Pilot" },
      { name: "description", content: "Blockzia Labs: secure AI co-pilot for crypto teams. Tokenomics, whitepaper, social threads, pitch decks, and investor outreach." },
      { property: "og:title", content: "Blockzia Labs — ICO Launch & Branding AI Co-Pilot" },
      { property: "og:description", content: "Blockzia Labs: secure AI co-pilot for crypto teams. Tokenomics, whitepaper, social threads, pitch decks, and investor outreach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();

  // Email confirmation links can land on the site root with the session in the URL hash.
  useEffect(() => {
    const hash = window.location.hash;
    if (/access_token=|type=(signup|recovery|magiclink|invite|email_change)/.test(hash)) {
      if (/type=recovery/.test(hash)) navigate({ to: "/reset-password" });
      else navigate({ to: "/auth/callback" });
    }
  }, [navigate]);

  return (

    <div className="min-h-screen relative">
      <div className="absolute inset-x-0 top-0 h-[560px] grid-bg pointer-events-none opacity-40" />

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
            <Link to="/services" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
            <span className="chip hidden md:inline-flex"><Star className="h-3 w-3" /> Beta · 20 founding teams</span>
            <Button asChild size="sm" variant="default">
              <Link to="/auth">Create account</Link>
            </Button>

          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        <section className="space-y-5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="chip chip-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Bull cycle window closing — 2026</span>
            <span className="chip">87% of tokens fail in their first 90 days</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto sm:mx-0 leading-[1.05]">
            Welcome to the next era of crypto intelligence. 🚀
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto sm:mx-0 text-base md:text-lg leading-relaxed">
            Every week you spend chasing a copywriter, tokenomics consultant, deck designer, and IR analyst is a week the narrative moves on without you — liquidity dries up, KOLs lose interest, the listing window slips.
            <span className="block mt-3 text-foreground">
              Blockzia compresses an <strong>$80k+ agency stack</strong> into one AI co-pilot. Whitepaper, tokenomics, decks, threads, and investor emails — generated from a single brand context, on-brand across every channel, ready to ship in an afternoon.
            </span>
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
            <Button asChild variant="default" size="lg">
                <a href="https://cal.com/blockzia-labs-hjymzq/60min" target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4" /> Claim your launch slot
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">
                Start free <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://blockzia.marketing/" target="_blank" rel="noopener noreferrer">
                Learn more
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Self-serve AI co-pilot · Optional done-for-you launch support · Cancel anytime</p>
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

        <section aria-labelledby="proof-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-primary" /> Trusted by founders shipping on Base, Solana & Arbitrum
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { quote: "Replaced our tokenomics consultant and deck agency in one weekend. Our seed round closed 3 weeks faster.", name: "Anon Founder", role: "L1 gaming token · $4M raise" },
              { quote: "The launch-week calendar alone paid for the year. Every post had a real on-chain CTA — not generic hype.", name: "Growth Lead", role: "DePIN protocol · Solana" },
              { quote: "Ex-Tokenomics lead at a top-10 L2 reviewed the output — said it was cleaner than most Series-A models he's seen.", name: "Kher Group advisory", role: "Advised 3 TGE launches in 2025" },
            ].map((t) => (
              <article key={t.name} className="panel p-5">
                <Quote className="h-5 w-5 text-primary mb-3" />
                <p className="text-sm leading-relaxed text-foreground/90">{t.quote}</p>
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="samples-heading" className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 id="samples-heading" className="text-2xl font-semibold tracking-tight">See what ships</h2>
              <p className="text-sm text-muted-foreground">Real (redacted) outputs from live launches — not stock screenshots.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: "Whitepaper excerpt", body: "## 3.2 Token Utility\nThe **$NOVA** token accrues fees from the settlement layer at 0.15% per swap, redistributed pro-rata to stakers with a 21-day cooldown…", tag: "Section 3.2 · redacted" },
              { icon: PieChart, label: "Tokenomics table", body: "Community 32% · 48mo\nTeam 18% · 36mo cliff 12\nInvestors 15% · 24mo\nTreasury 20% · linear 48\nLiquidity 10% · TGE\nAdvisors 5% · 24mo", tag: "Max supply 500M · Base" },
              { icon: MessageSquare, label: "X launch thread", body: "1/ Most L2s ship yield. We ship settlement.\n\n2/ $NOVA routes 100% of protocol fees to stakers — no VC unlock cliff, no rebase games.\n\n3/ Launching on @base Nov 14. Snapshot for early users → …", tag: "8-tweet thread · 4.2k impressions" },
            ].map(({ icon: Icon, label, body, tag }) => (
              <article key={label} className="panel p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/85 bg-background/40 border border-border rounded-md p-3 flex-1 overflow-hidden">{body}</pre>
                <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">{tag}</div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pricing-heading" className="space-y-4">
          <div className="text-center space-y-2">
            <h2 id="pricing-heading" className="text-2xl md:text-3xl font-semibold tracking-tight">Simple, launch-ready pricing</h2>
            <p className="text-sm text-muted-foreground">Start free. Upgrade when you're ready to ship. No sales calls required.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <article className="panel p-6 flex flex-col">
              <div className="text-sm font-semibold tracking-tight">Starter</div>
              <div className="mt-2 text-3xl font-bold tracking-tight">Free</div>
              <div className="text-xs text-muted-foreground mt-1">4 credits · refills every 12h</div>
              <ul className="mt-5 space-y-2 flex-1">
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Tokenomics simulator</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Whitepaper & deck previews</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Community-tier support</li>
              </ul>
              <Button asChild variant="secondary" className="mt-6 w-full">
                <Link to="/auth">Start generating <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </article>

            <article className="panel p-6 flex flex-col border-primary/60 ring-1 ring-primary/30">
              <div className="chip chip-primary self-start mb-3"><Star className="h-3 w-3" /> Best for launches</div>
              <div className="text-sm font-semibold tracking-tight">Blockzia Labs</div>
              <div className="mt-2 text-3xl font-bold tracking-tight">Custom</div>
              <div className="text-xs text-muted-foreground mt-1">Tailored launch support for serious teams</div>
              <ul className="mt-5 space-y-2 flex-1">
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Everything in Starter</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Done-for-you launch kit</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Human strategist review</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Tokenomics audit support</li>
                <li className="flex gap-2 text-sm text-foreground/90"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />KOL & exchange intros</li>
              </ul>
              <Button asChild variant="default" className="mt-6 w-full">
                <a href="https://cal.com/blockzia-labs-hjymzq/60min" target="_blank" rel="noopener noreferrer">Get in touch <ArrowUpRight className="h-4 w-4" /></a>
              </Button>
            </article>
          </div>
          <p className="text-center text-xs text-muted-foreground">All plans include encrypted transit and audit logs. Beta pricing — locked in for the first 20 founding teams.</p>
        </section>

        <footer className="pt-10 pb-6 text-center text-xs text-muted-foreground">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 pb-5">
            <Link to="/services" className="hover:text-foreground transition-colors">All services</Link>
            <Link to="/services/tokenomics-design" className="hover:text-foreground transition-colors">Tokenomics design</Link>
            <Link to="/services/whitepaper-writing" className="hover:text-foreground transition-colors">Whitepaper writing</Link>
            <Link to="/services/ico-marketing" className="hover:text-foreground transition-colors">ICO launch marketing</Link>
            <Link to="/services/investor-outreach" className="hover:text-foreground transition-colors">Investor outreach</Link>
            <Link to="/services/community-growth" className="hover:text-foreground transition-colors">Community growth</Link>
            <Link to="/services/seo-for-crypto" className="hover:text-foreground transition-colors">SEO for crypto</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy policy</Link>
          </nav>
          <p>© {new Date().getFullYear()} Blockzia Labs. All rights reserved.</p>
          <p className="mt-1">Encrypted in transit · Audit log available · Role-based access enabled</p>
        </footer>
      </main>
    </div>
  );
}
