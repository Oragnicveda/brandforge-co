/**
 * Content for the public SEO pillar pages. Each entry maps one keyword cluster
 * from the SEO plan onto a real, indexable page on the site.
 */
export type ServicePage = {
  slug: string;
  route: string;
  cluster: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
  outcomes: { label: string; value: string }[];
  deliverables: { name: string; detail: string; timeline: string }[];
  process: { step: string; detail: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "tokenomics-design",
    route: "/services/tokenomics-design",
    cluster: "Tokenomics design & modelling",
    h1: "Tokenomics Design & Emission Modelling for Token Launches",
    title: "Tokenomics Design Services for Crypto Projects | Blockzia Labs",
    description:
      "Investor-ready tokenomics: allocation tables, vesting cliffs, 24-month emission curves and supply caps modelled for your chain and raise. Built by Blockzia Labs.",
    intro:
      "Most tokens fail on the maths, not the idea. We model your allocations, vesting cliffs and emission curve so the supply schedule survives investor diligence, exchange review and the first unlock.",
    keywords: [
      "tokenomics design services",
      "token allocation and vesting schedule",
      "token emission schedule model",
      "max token supply calculation",
      "tokenomics consultant for ICO",
    ],
    outcomes: [
      { label: "Allocation table", value: "sums to 100%" },
      { label: "Emission curve", value: "24 months modelled" },
      { label: "Diligence pack", value: "ready in days" },
    ],
    deliverables: [
      { name: "Allocation & vesting table", detail: "5–7 categories with cliffs, linear unlocks and rationale per bucket.", timeline: "Day 1–2" },
      { name: "24-month emission curve", detail: "Monthly circulating supply charted against your max supply cap.", timeline: "Day 2" },
      { name: "Sell-pressure stress test", detail: "Unlock-by-unlock view of float versus expected liquidity depth.", timeline: "Day 3" },
      { name: "Investor summary", detail: "One page explaining the strategic logic to funds and exchange listing teams.", timeline: "Day 3" },
    ],
    process: [
      { step: "Brief", detail: "You give us mission, audience, chain, stage, raise target and supply cap." },
      { step: "Model", detail: "The co-pilot generates allocations and emissions; a strategist sanity-checks the curve." },
      { step: "Pressure-test", detail: "We compare unlocks against liquidity so month-6 doesn't break the chart." },
      { step: "Ship", detail: "Export as PDF or Markdown and drop it straight into the whitepaper and deck." },
    ],
    faqs: [
      { q: "How is the max supply decided?", a: "From your raise target, intended float at listing and the incentive budget your audience needs. If you already have a cap, every schedule is built to respect it exactly." },
      { q: "Will this pass an exchange review?", a: "Listing teams look for a coherent allocation table, credible team vesting and no hidden unlocks. The output is structured to answer those three questions on one page." },
      { q: "Can you model more than one scenario?", a: "Yes — conservative, base and aggressive emission cases so you can see the float difference before you commit." },
    ],
    related: ["whitepaper-writing", "investor-outreach"],
  },
  {
    slug: "whitepaper-writing",
    route: "/services/whitepaper-writing",
    cluster: "Whitepaper & documentation",
    h1: "Crypto Whitepaper Writing & Litepaper Production",
    title: "Crypto Whitepaper Writing Services | Blockzia Labs",
    description:
      "Full whitepapers with abstract, architecture, tokenomics tables, roadmap, risk factors and legal disclaimer — written in your brand voice and consistent with your token model.",
    intro:
      "A whitepaper is the document every investor, exchange and journalist reads first. We produce the whole thing — architecture, tokenomics, roadmap, risks and disclaimer — with the numbers matching your model everywhere.",
    keywords: [
      "crypto whitepaper writing service",
      "how to write a token whitepaper",
      "litepaper vs whitepaper",
      "whitepaper template for ICO",
      "web3 technical documentation writer",
    ],
    outcomes: [
      { label: "Length", value: "~1,800 words" },
      { label: "Sections", value: "11, in order" },
      { label: "Turnaround", value: "same day draft" },
    ],
    deliverables: [
      { name: "Full whitepaper", detail: "Abstract, problem, solution, architecture, tokenomics, roadmap, team, risks, disclaimer.", timeline: "Day 1" },
      { name: "Litepaper cut-down", detail: "A 2-page version for Telegram, launchpads and cold outreach.", timeline: "Day 2" },
      { name: "Consistency pass", detail: "Supply, allocations, dates and ticker checked against your tokenomics model.", timeline: "Day 2" },
      { name: "Export bundle", detail: "PDF and Markdown, ready for your docs site or data room.", timeline: "Day 2" },
    ],
    process: [
      { step: "Context", detail: "Brand voice, banned words and key phrases are captured once and reused." },
      { step: "Draft", detail: "The co-pilot writes every section against your real brief — no generic filler." },
      { step: "Review", detail: "You edit inline; version history keeps every prior draft." },
      { step: "Publish", detail: "Export and ship to your site, launchpad and investor room." },
    ],
    faqs: [
      { q: "Do you invent team names or metrics?", a: "No. Roles are described as archetypes and every number comes from your brief, so nothing unverifiable ends up in the document." },
      { q: "Can it follow our tone of voice?", a: "Yes — brand guidelines including banned words and key phrases are applied to every sentence." },
      { q: "Is a legal review included?", a: "The disclaimer is drafted for your raise type, but it is not legal advice. Have counsel review before publishing." },
    ],
    related: ["tokenomics-design", "ico-marketing"],
  },
  {
    slug: "ico-marketing",
    route: "/services/ico-marketing",
    cluster: "ICO & token launch marketing",
    h1: "ICO Launch Marketing: Threads, Announcements & Launch-Week Plan",
    title: "ICO & Token Launch Marketing Services | Blockzia Labs",
    description:
      "Launch-week content that ships: 8-tweet X threads, Telegram and Discord announcements, and a 7-day crypto-native calendar with real channel links and on-chain CTAs.",
    intro:
      "Launch week is won by preparation. You get the thread, the announcements and a day-by-day calendar with the actual copy, the channel, the CTA and the link — so nothing is written at 2am.",
    keywords: [
      "ICO marketing agency",
      "token launch marketing plan",
      "crypto launch week checklist",
      "how to promote a token presale",
      "crypto twitter thread template",
    ],
    outcomes: [
      { label: "Launch calendar", value: "7 days, mapped" },
      { label: "X thread", value: "8 posts, ≤270 chars" },
      { label: "Channels", value: "X, TG, Discord, Farcaster" },
    ],
    deliverables: [
      { name: "Launch-day pack", detail: "8-tweet thread, Telegram announcement and Discord community post.", timeline: "Day 1" },
      { name: "7-day launch calendar", detail: "Channel, format, topic, publishable hook, CTA and a real working link per day.", timeline: "Day 1" },
      { name: "Asset checklist", detail: "Everything the team must prep before Monday, with dimensions and owners.", timeline: "Day 2" },
      { name: "Narrative arc", detail: "How days 1→7 escalate from awareness to proof to conversion.", timeline: "Day 2" },
    ],
    process: [
      { step: "Positioning", detail: "We pin the wedge and the one claim the launch is built on." },
      { step: "Generate", detail: "Copy is written for your audience's vocabulary, not generic crypto hype." },
      { step: "Schedule", detail: "Each post is assigned a day, channel, owner and measurable CTA." },
      { step: "Measure", detail: "Sentiment checks flag regulatory or PR risk before you publish." },
    ],
    faqs: [
      { q: "Are the links real?", a: "Yes — canonical domains only (DexScreener, CoinGecko, Snapshot, Galxe, the right block explorer for your chain). No placeholders." },
      { q: "Do you post for us?", a: "The copy is publish-ready for your team or community manager. Scheduling stays in your hands." },
      { q: "Can we reuse it after launch?", a: "The calendar format repeats for listing weeks, governance votes and unlock events." },
    ],
    related: ["community-growth", "seo-for-crypto"],
  },
  {
    slug: "investor-outreach",
    route: "/services/investor-outreach",
    cluster: "Investor relations & fundraising",
    h1: "Investor Outreach: Pitch Decks, Cold Emails & Target Lists",
    title: "Crypto Pitch Deck & Investor Outreach Services | Blockzia Labs",
    description:
      "10-slide investor decks with speaker notes and image briefs, plus cold emails, day-5 follow-ups and a fit-scored VC target list for your stage and raise size.",
    intro:
      "Raising is a pipeline problem. You get the deck, the first email, the follow-up and a target list where every row explains why that fund should care about your project specifically.",
    keywords: [
      "crypto pitch deck template",
      "web3 investor outreach email",
      "crypto VC target list",
      "token fundraising deck",
      "seed round deck for blockchain startup",
    ],
    outcomes: [
      { label: "Deck", value: "10 slides + notes" },
      { label: "Target list", value: "8 scored rows" },
      { label: "Sequence", value: "email + day-5 follow-up" },
    ],
    deliverables: [
      { name: "Investor deck", detail: "Cover to ask, each slide with headline, key points, speaker notes and an image brief.", timeline: "Day 1" },
      { name: "Cold email", detail: "120–160 words: referral hook, problem, edge, traction, soft 20-minute CTA.", timeline: "Day 1" },
      { name: "Day-5 follow-up", detail: "80–110 words that add new information rather than nudging.", timeline: "Day 1" },
      { name: "Fit-scored target list", detail: "Firm archetype, stage focus, thesis fit, why-you reason and contact angle.", timeline: "Day 2" },
    ],
    process: [
      { step: "Calibrate", detail: "Stage and raise size set the story, the ask and the use-of-funds split." },
      { step: "Build", detail: "Deck and emails are generated from the same brand context, so nothing contradicts." },
      { step: "Target", detail: "Each fund row names a concrete reason: portfolio overlap, chain thesis or audience fit." },
      { step: "Iterate", detail: "Version history lets you A/B subject lines and ask slides." },
    ],
    faqs: [
      { q: "Do you guarantee introductions?", a: "No. We build the deck, the sequence and the target logic; warm intros come from your network and our advisory calls." },
      { q: "Is the deck design-ready?", a: "Every slide includes a detailed image brief so a designer or an image model can produce visuals immediately." },
      { q: "What raise sizes does this fit?", a: "Pre-seed through strategic rounds — the narrative and use-of-funds split adjust to the amount you enter." },
    ],
    related: ["tokenomics-design", "whitepaper-writing"],
  },
  {
    slug: "community-growth",
    route: "/services/community-growth",
    cluster: "Community growth & moderation",
    h1: "Crypto Community Growth: 7 Days of Publish-Ready Posts",
    title: "Crypto Community Growth Services (Telegram, Discord, Reddit) | Blockzia Labs",
    description:
      "A week of ready-to-post Telegram, Discord, Reddit, X and Farcaster copy with a growth mechanic, a real link and a measurable target for every single day.",
    intro:
      "Community growth stalls when nobody knows what to post. You get seven days of finished copy per platform, each with a growth loop, a reward and a number to hit.",
    keywords: [
      "crypto community growth strategy",
      "telegram community growth for tokens",
      "discord server growth crypto",
      "reddit crypto marketing",
      "web3 community manager playbook",
    ],
    outcomes: [
      { label: "Posts", value: "7 days × 4 platforms" },
      { label: "Mechanics", value: "quests, referrals, AMAs" },
      { label: "Targets", value: "measurable per day" },
    ],
    deliverables: [
      { name: "Daily post set", detail: "Telegram, Discord (named channel), Reddit (real subreddit) and X/Farcaster copy.", timeline: "Day 1" },
      { name: "Growth mechanic per day", detail: "Invite contest, referral code, quest, points multiplier, AMA or meme bounty with exact rules.", timeline: "Day 1" },
      { name: "Moderation & safety notes", detail: "Scam-bot defence, verification flow, DM-scam warnings and mod tone rules.", timeline: "Day 2" },
      { name: "KPI table", detail: "Day, platform, mechanic, target metric and owner for the whole week.", timeline: "Day 2" },
    ],
    process: [
      { step: "Map", detail: "We identify the acquisition platform versus the retention home for your audience." },
      { step: "Loop", detail: "One growth loop is chosen for the week and every post feeds it." },
      { step: "Publish", detail: "Copy is final — the community manager pastes and ships." },
      { step: "Review", detail: "Weekly KPI table shows which mechanic actually moved members." },
    ],
    faqs: [
      { q: "Will Reddit posts get removed?", a: "Posts are written like a native redditor: value first, project mentioned as context, and matched to a subreddit's self-promo norms." },
      { q: "Do rewards have to be in our token?", a: "Rewards are denominated in your token by default, but points or allowlist spots work the same way." },
      { q: "Can we run this before launch?", a: "Yes — pre-launch weeks focus on verification, quests and mod recruitment instead of listings." },
    ],
    related: ["ico-marketing", "seo-for-crypto"],
  },
  {
    slug: "seo-for-crypto",
    route: "/services/seo-for-crypto",
    cluster: "SEO & search visibility",
    h1: "SEO for Crypto Projects: Keyword Plans, Technical Fixes & Content",
    title: "SEO Services for Crypto & Web3 Projects | Blockzia Labs",
    description:
      "A full crypto SEO plan: keyword clusters with volume and difficulty estimates, page blueprints, technical checklist, an 8-week content calendar and AI-search visibility.",
    intro:
      "Search is the only channel that keeps delivering after launch week. Our SEO agent produces the whole plan — keyword universe, clusters, page blueprints, technical fixes, content calendar and KPIs — then we turn the blueprints into real pages.",
    keywords: [
      "SEO for crypto projects",
      "web3 SEO agency",
      "crypto keyword research",
      "how to rank a token website",
      "AI search visibility for crypto",
    ],
    outcomes: [
      { label: "Keyword universe", value: "38+ scored terms" },
      { label: "Clusters", value: "5 pillars mapped" },
      { label: "Calendar", value: "8 weeks planned" },
    ],
    deliverables: [
      { name: "Keyword universe", detail: "Head, commercial, long-tail question and competitor-gap tables with volume, difficulty and priority.", timeline: "Day 1" },
      { name: "Cluster → architecture map", detail: "Pillar pages, three supporting pages each and internal-link rules with exact slugs.", timeline: "Day 1" },
      { name: "On-page blueprints", detail: "Title, meta description, single H1, H2 outline, word count, schema type and CTA per page.", timeline: "Day 2" },
      { name: "Technical checklist & KPIs", detail: "Core Web Vitals, indexation, schema, sitemap plus 30/90-day KPI targets.", timeline: "Day 3" },
    ],
    process: [
      { step: "Research", detail: "Intent mapping across your audience's journey, then keyword scoring." },
      { step: "Architect", detail: "Clusters become a site structure, not a spreadsheet." },
      { step: "Build", detail: "Blueprints are shipped as real indexable pages — like the ones you're reading." },
      { step: "Track", detail: "Impressions, non-brand clicks, positions, referring domains and AI citations." },
    ],
    faqs: [
      { q: "Are the search volumes exact?", a: "They are labelled estimates for prioritisation. Validate the shortlist in a keyword tool before you commit budget." },
      { q: "What is AI-search visibility?", a: "Being cited by answer engines: consistent entity data, FAQ schema, third-party corroboration and structured token facts." },
      { q: "How fast does SEO work?", a: "Expect indexation in days, meaningful non-brand movement in 8–12 weeks. The 90-day roadmap sets gates for each phase." },
    ],
    related: ["ico-marketing", "whitepaper-writing"],
  },
];

export const getServicePage = (slug: string) =>
  SERVICE_PAGES.find((p) => p.slug === slug)!;
