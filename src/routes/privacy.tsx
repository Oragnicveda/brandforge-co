import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, CAL_URL } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CalendarCheck, ChevronRight, Shield } from "lucide-react";

const TITLE = "Privacy Policy — Blockzia Labs";
const DESC = "How Blockzia Labs collects, uses, stores and protects your data when you use our ICO launch and branding AI co-pilot.";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.blockzialabs.com/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.blockzialabs.com/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <PublicShell>
      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Privacy policy</span>
        </nav>

        <header className="mt-6 space-y-4">
          <span className="chip chip-primary"><Shield className="h-3 w-3" /> Data & AI governance</span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">Privacy policy</h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. This policy explains how Blockzia Labs collects, uses, stores and protects your information when you use our website, dashboard and AI co-pilot services.
          </p>
        </header>

        <article className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">1. Information we collect</h2>
            <p className="text-muted-foreground">
              We collect the information you provide directly (name, email, company, role, project details, token ticker, chain, raise size, brand voice), authentication data managed by our backend auth provider, and usage data such as generations, credit balance, audit logs and account preferences. We do not collect wallet private keys or on-chain signing authority.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">2. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Provide, operate and improve the Blockzia Labs dashboard and AI agents.</li>
              <li>Generate personalized tokenomics, whitepaper, marketing, investor, community, SEO and growth outputs.</li>
              <li>Manage credits, billing, account access and customer support.</li>
              <li>Maintain audit logs, version history and security monitoring.</li>
              <li>Send service, product and account-related emails. You can opt out of non-essential communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">3. AI processing and your data</h2>
            <p className="text-muted-foreground">
              When you run an agent, your project inputs are sent to our AI gateway and selected model providers to produce outputs. We do not use your proprietary project data to train third-party AI models unless you explicitly opt in. Generated outputs are stored in your account and are visible only to you and authorized workspace members.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">4. Sharing and third parties</h2>
            <p className="text-muted-foreground">
              We share data only with trusted service providers required to operate the platform (authentication, database, email, AI inference, analytics, calendar booking). We do not sell personal information. We may disclose data if required by law or to protect our rights and users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">5. Cookies and analytics</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management, and may use analytics cookies to understand how the product is used. You can control non-essential cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">6. Data retention and security</h2>
            <p className="text-muted-foreground">
              We keep your account and generated content for as long as your account is active. You can request deletion of your account and data at any time. We use encryption in transit, role-based access controls, audit logs and industry-standard practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">7. Your rights</h2>
            <p className="text-muted-foreground">
              Depending on your location, you may have the right to access, correct, delete, restrict or export your personal data. Contact us at the email below to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">8. Children's privacy</h2>
            <p className="text-muted-foreground">
              Blockzia Labs is not intended for users under 18 years of age. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">9. Changes to this policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. The latest version will always be posted here with the updated date. Continued use of the platform after changes means you accept the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-3">10. Contact us</h2>
            <p className="text-muted-foreground">
              Questions about this policy or your data? Reach out at{" "}
              <a href="mailto:blockziamarketing@gmail.com" className="text-primary hover:underline">blockziamarketing@gmail.com</a>.
            </p>
          </section>
        </article>

        <section className="mt-14 p-6 rounded-2xl border border-border/60 bg-card/50 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Need a compliance or launch review?</h2>
          <p className="text-sm text-muted-foreground">
            Book a 60-minute consult and we'll walk through your tokenomics, documentation, marketing plan and data-room readiness.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer"><CalendarCheck className="h-4 w-4" /> Book a 60-min consult</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start free in the app <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
