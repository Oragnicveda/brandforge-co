import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, CAL_URL } from "@/components/PublicShell";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CalendarCheck, ChevronRight } from "lucide-react";

const TITLE = "Crypto Launch Services — Tokenomics, Whitepaper, Marketing & SEO | Blockzia Labs";
const DESC =
  "Six service clusters for token teams: tokenomics design, whitepaper writing, ICO launch marketing, investor outreach, community growth and crypto SEO.";

export const Route = createFileRoute("/services/")({
  component: ServicesHub,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.blockzialabs.com/services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.blockzialabs.com/services" }],
  }),
});

function ServicesHub() {
  return (
    <PublicShell>
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Services</span>
        </nav>

        <header className="mt-6 space-y-4 max-w-3xl">
          <span className="chip chip-primary">Six clusters · one brand context</span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            Everything a token launch needs, mapped to one page each
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Each service below is a full workstream with defined deliverables, timelines and KPIs. Pick the one blocking your launch — or book a session and we'll sequence them.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer"><CalendarCheck className="h-4 w-4" /> Book a 60-min consult</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start free in the app <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICE_PAGES.map((p) => (
            <Link
              key={p.slug}
              to={p.route}
              className="rounded-2xl border border-border/60 bg-card/50 p-6 hover:border-primary/50 transition-colors flex flex-col"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.cluster}</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{p.h1}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{p.intro}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.outcomes.map((o) => (
                  <span key={o.label} className="chip">{o.label}: {o.value}</span>
                ))}
              </div>
              <span className="mt-4 text-sm text-primary inline-flex items-center gap-1">
                View service <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
