import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicShell, CAL_URL } from "@/components/PublicShell";
import { getServicePage, type ServicePage } from "@/lib/service-pages";
import { ArrowUpRight, CalendarCheck, Check, ChevronRight, Search } from "lucide-react";

/**
 * Presentation for one SEO pillar page: hero, outcomes, deliverables table,
 * process, keyword coverage, FAQ and CTA — one consistent structure per page.
 */
export function ServicePageView({ page }: { page: ServicePage }) {
  const related = page.related.map(getServicePage);

  return (
    <PublicShell>
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/services" className="hover:text-foreground transition-colors">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{page.cluster}</span>
        </nav>

        <header className="mt-6 space-y-5">
          <span className="chip chip-primary">{page.cluster}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">{page.h1}</h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl">{page.intro}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4" /> Book a 60-min consult
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start free in the app <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {page.outcomes.map((o) => (
            <div key={o.label} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{o.label}</div>
              <div className="mt-1.5 text-lg font-semibold tracking-tight">{o.value}</div>
            </div>
          ))}
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">What you receive</h2>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-card/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Deliverable</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {page.deliverables.map((d) => (
                  <tr key={d.name} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium align-top whitespace-nowrap">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground align-top">{d.detail}</td>
                    <td className="px-4 py-3 text-muted-foreground align-top whitespace-nowrap">{d.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {page.process.map((p, i) => (
              <li key={p.step} className="rounded-xl border border-border/60 bg-card/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md grid place-items-center text-xs font-semibold text-background" style={{ background: "var(--gradient-violet)" }}>{i + 1}</span>
                  <span className="font-medium">{p.step}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Questions this page answers</h2>
          <ul className="flex flex-wrap gap-2">
            {page.keywords.map((k) => (
              <li key={k} className="chip"><Search className="h-3 w-3" /> {k}</li>
            ))}
          </ul>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="divide-y divide-border/60 rounded-xl border border-border/60">
            {page.faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer font-medium marker:content-none flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 transition-transform group-open:rotate-90" />
                  {f.q}
                </summary>
                <p className="mt-2 pl-6 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to move on {page.cluster.toLowerCase()}?</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Bring your brief to a 60-minute session, or generate the first draft yourself inside the app — free credits included.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Private by default, audit-logged</li>
            <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />One brand context across every asset</li>
            <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />PDF and Markdown export</li>
            <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />Version history on every draft</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer"><CalendarCheck className="h-4 w-4" /> Book a consult</a>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/auth">Create account</Link>
            </Button>
          </div>
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Related services</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} to={r.route} className="rounded-xl border border-border/60 bg-card/50 p-5 hover:border-primary/50 transition-colors">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.cluster}</div>
                <div className="mt-1.5 font-medium">{r.h1}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

/** FAQPage + Service structured data for one page. */
export function serviceJsonLd(page: ServicePage) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: page.h1,
        description: page.description,
        serviceType: page.cluster,
        provider: { "@type": "Organization", name: "Blockzia Labs", url: "https://www.blockzialabs.com" },
        url: `https://www.blockzialabs.com${page.route}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });
}
