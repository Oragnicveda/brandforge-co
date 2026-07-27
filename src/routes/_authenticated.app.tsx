import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/Dashboard";

export const Route = createFileRoute("/_authenticated/app")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Blockzia Labs — ICO Launch Co-Pilot" },
      { name: "description", content: "AI-powered launch kit for crypto founders. Tokenomics, whitepaper, social threads, pitch decks, and investor outreach." },
      { property: "og:title", content: "Blockzia Labs — ICO Launch Co-Pilot" },
      { property: "og:description", content: "AI-powered launch kit for crypto founders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
