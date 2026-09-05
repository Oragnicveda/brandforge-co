import { createFileRoute } from "@tanstack/react-router";
import { ServicePageView, serviceJsonLd } from "@/components/ServicePageView";
import { getServicePage } from "@/lib/service-pages";

const page = getServicePage("community-growth");

export const Route = createFileRoute("/services/community-growth")({
  component: () => <ServicePageView page={page} />,
  head: () => ({
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://www.blockzialabs.com${page.route}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://www.blockzialabs.com${page.route}` }],
    scripts: [{ type: "application/ld+json", children: serviceJsonLd(page) }],
  }),
});
