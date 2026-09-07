import { Link } from "@tanstack/react-router";
import { Hexagon, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const CAL_URL = "https://cal.com/blockzia-labs-hjymzq/60min";

/** Shared header/footer chrome for the public marketing + SEO pages. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-x-0 top-0 h-[420px] grid-bg pointer-events-none opacity-30" />

      <header className="relative border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg grid place-items-center" style={{ background: "var(--gradient-violet)" }}>
              <Hexagon className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold tracking-tight leading-none truncate">Blockzia Labs</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5 truncate">Launch · Brand · Comply</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2 shrink-0">
            <Link to="/services" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
            <Button asChild size="sm">
              <Link to="/auth">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="relative border-t border-border/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
          <div>
            <div className="font-semibold tracking-tight">Blockzia Labs</div>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              The ICO launch and branding co-pilot for crypto teams. Tokenomics, documentation, marketing and investor relations from one brand context.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Services</div>
            <ul className="mt-3 space-y-1.5">
              <li><Link to="/services/tokenomics-design" className="text-muted-foreground hover:text-foreground transition-colors">Tokenomics design</Link></li>
              <li><Link to="/services/whitepaper-writing" className="text-muted-foreground hover:text-foreground transition-colors">Whitepaper writing</Link></li>
              <li><Link to="/services/ico-marketing" className="text-muted-foreground hover:text-foreground transition-colors">ICO launch marketing</Link></li>
              <li><Link to="/services/investor-outreach" className="text-muted-foreground hover:text-foreground transition-colors">Investor outreach</Link></li>
              <li><Link to="/services/community-growth" className="text-muted-foreground hover:text-foreground transition-colors">Community growth</Link></li>
              <li><Link to="/services/seo-for-crypto" className="text-muted-foreground hover:text-foreground transition-colors">SEO for crypto</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Talk to us</div>
            <div className="mt-3 space-y-2">
              <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                <a href={CAL_URL} target="_blank" rel="noopener noreferrer">Book a 60-min consult <ArrowUpRight className="h-4 w-4" /></a>
              </Button>
              <p className="text-xs text-muted-foreground">blockziamarketing@gmail.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Blockzia Labs. All rights reserved. · Encrypted in transit · Audit log available
        </div>
      </footer>
    </div>
  );
}

export { CAL_URL };
