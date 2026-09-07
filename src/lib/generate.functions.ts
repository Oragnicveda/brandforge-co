import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deductCredits, type CreditKind } from "@/lib/credits.server";
import type { Json } from "@/integrations/supabase/types";

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  mission: z.string().min(1).max(2000),
  audience: z.string().min(1).max(500),
  token: z.string().min(1).max(1000),
  maxSupply: z.string().max(200).optional().default(""),
  brand: z.string().max(3000).optional().default(""),
  company: z.string().max(200).optional().default(""),
  stage: z.string().max(120).optional().default(""),
  chain: z.string().max(120).optional().default(""),
  raiseSize: z.string().max(120).optional().default(""),
  fullName: z.string().max(200).optional().default(""),
  role: z.string().max(120).optional().default(""),
  workEmail: z.string().max(200).optional().default(""),
  kind: z.enum(["whitepaper", "social", "deck", "emails", "tokenomics", "calendar", "community", "seo", "growth", "sentiment"]),
  extra: z.string().max(2000).optional().default(""),
  projectId: z.string().uuid().optional(),
});

// The OmniRoute tunnel answers every request with an SSE stream, even when the
// client asks for a buffered completion. Collapse that stream back into a normal
// chat-completion JSON body so non-streaming calls parse correctly.
const omnirouteFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input as any, init as any);
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok || !ct.includes("text/event-stream")) return res;

  const raw = await res.text();
  let content = "";
  let reasoning = "";
  let finish = "stop";
  let usage: unknown = undefined;
  let id = "omniroute";
  let model = "omniroute";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const chunk = JSON.parse(payload);
      if (chunk.id) id = chunk.id;
      if (chunk.model) model = chunk.model;
      if (chunk.usage) usage = chunk.usage;
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      if (choice.finish_reason) finish = choice.finish_reason;
      const delta = choice.delta ?? {};
      if (typeof delta.content === "string") content += delta.content;
      if (typeof delta.reasoning_content === "string") reasoning += delta.reasoning_content;
    } catch {
      // ignore keep-alive / malformed lines
    }
  }

  const body = {
    id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: content || reasoning,
        },
        finish_reason: finish,
      },
    ],
    ...(usage ? { usage } : {}),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

function getModels() {
  const models: Array<{ label: string; model: ReturnType<ReturnType<typeof createOpenAICompatible>> }> = [];

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    const nvidia = createOpenAICompatible({
      name: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      headers: { Authorization: `Bearer ${nvidiaKey}` },
    });
    models.push({ label: "nvidia", model: nvidia("nvidia/nemotron-3-super-120b-a12b") });
  }

  const omniBase = process.env.OMNIROUTE_BASE_URL;
  const omniKey = process.env.OMNIROUTE_API_KEY;
  if (omniBase && omniKey) {
    const omniroute = createOpenAICompatible({
      name: "omniroute",
      baseURL: omniBase.replace(/\/+$/, ""),
      headers: {
        Authorization: `Bearer ${omniKey}`,
        "ngrok-skip-browser-warning": "1",
      },
      fetch: omnirouteFetch,
    });
    models.push({ label: "omniroute", model: omniroute("auto/best-coding") });
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const openrouter = createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      headers: { Authorization: `Bearer ${orKey}` },
    });
    models.push({ label: "openrouter", model: openrouter("google/gemini-2.5-flash") });
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const lovable = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { Authorization: `Bearer ${lovableKey}`, "Lovable-API-Key": lovableKey },
    });
    models.push({ label: "lovable", model: lovable("google/gemini-3.7-flash") });
  }

  if (!models.length) throw new Error("No AI provider configured");
  // Fastest / most reliable providers first; the public OmniRoute tunnel last.
  const order = ["nvidia", "lovable", "openrouter", "omniroute"];
  models.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return models;
}

/** Run a generation against each configured provider until one succeeds. */
async function withFallback<T>(
  run: (model: ReturnType<ReturnType<typeof createOpenAICompatible>>) => Promise<T>,
): Promise<T> {
  const providers = getModels();
  let lastError: unknown;
  for (const { label, model } of providers) {
    try {
      return await run(model);
    } catch (err) {
      lastError = err;
      console.error(`[generate] provider "${label}" failed, trying next`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All AI providers failed");
}




const brandPreamble = (b: string) =>
  b ? `\n\nBRAND VOICE GUIDELINES (must be followed strictly — apply tone, banned words, key phrases, and identity notes to every sentence):\n${b}\n` : "";

const projectContext = (d: z.infer<typeof projectSchema>) => `PROJECT BRIEF (use these EXACT facts — never invent a different name, ticker, chain, audience, or supply):
- Project name: ${d.name}
- Company: ${d.company || "(not specified)"}
- Mission: ${d.mission}
- Target audience: ${d.audience}
- Token details: ${d.token}
- Max supply: ${d.maxSupply || "(not specified — propose one and reuse it everywhere)"}
- Primary chain: ${d.chain || "(not specified)"}
- Launch stage: ${d.stage || "(not specified)"}
- Target raise: ${d.raiseSize || "(not specified)"}${brandPreamble(d.brand)}

TAILORING RULES (mandatory):
- Reference "${d.name}" by name in every section, not "the project" or "our token".
- Anchor every claim to the mission, audience, token utility, chain, and stage above.
- Use the audience's vocabulary (${d.audience}) — pick metaphors, KPIs, and CTAs they actually respond to.
- Numbers (supply, allocations, raise, prices, dates) must be internally consistent across the whole document.
- NO generic crypto filler ("revolutionary", "disrupting the space", "to the moon", "next-gen Web3 ecosystem"). If a sentence could appear in any other whitepaper, rewrite it.
- NO placeholders like "[insert]", "TBD", "Lorem ipsum", or "your project here".`;

const formatRules = (d: z.infer<typeof projectSchema>) => `\n\nFORMATTING RULES (mandatory):
- Output GitHub-Flavored Markdown only. No code fences around the whole document.
- Start with a single \`#\` H1 title that includes "${d.name}". Use \`##\` for sections, \`###\` for subsections.
- Use real Markdown tables (header row + separator) wherever data is comparative.
- Use bullet/numbered lists with consistent indentation. Bold key terms with **...**.
- Insert blank lines between every heading, paragraph, list, and table.
- No raw HTML, no emoji-only lines, no "[insert here]" placeholders — every value must be specific to ${d.name}.`;

const textPrompts = (d: z.infer<typeof projectSchema>) => ({
  whitepaper: `${projectContext(d)}${formatRules(d)}

Write a professional whitepaper (~1800 words) for ${d.name} on ${d.chain || "its chain"}. Each section must reference ${d.name}'s actual mission and audience — no generic crypto prose.

Sections in order:
1. \`# ${d.name} Whitepaper\` (subtitle: one-line positioning derived from the mission)
2. \`## Abstract\` — 3-5 sentences naming ${d.name}, the problem, the audience "${d.audience}", and the token (${d.token}).
3. \`## 1. Introduction\` — why ${d.name} now, grounded in market context.
4. \`## 2. Problem Statement\` — 3 concrete pains felt by ${d.audience}.
5. \`## 3. Solution & Product\` — ${d.name}'s product surface and core flows.
6. \`## 4. Technology Architecture\` — modules, ${d.chain || "chain"} choice rationale, security model.
7. \`## 5. Tokenomics\` — Markdown table \`| Allocation | % | Vesting | Purpose |\` summing to 100%. Max supply: ${d.maxSupply || "propose a credible figure and reuse it"}.
8. \`## 6. Roadmap\` — Markdown table \`| Quarter | Milestone | KPI |\` covering the next 6 quarters from ${d.stage || "current stage"}.
9. \`## 7. Team & Advisors\` — 4-6 realistic archetype roles tied to ${d.name}'s needs (no real names; use "Co-founder & CEO — ex-...").
10. \`## 8. Risk Factors\` — 5 risks specific to ${d.chain || "the chain"}, ${d.audience}, and token utility.
11. \`## 9. Legal Disclaimer\` — tailored to a ${d.raiseSize || "private/public"} raise.`,

  social: `${projectContext(d)}${formatRules(d)}

Produce launch-day content for ${d.name}. Voice MUST match the audience "${d.audience}" and the brand guidelines above.

\`# ${d.name} Launch Pack\`

\`## X / Twitter Thread\`
Exactly 8 tweets numbered \`1/8\` … \`8/8\`, each on its own line, ≤ 270 chars. Tweet 1 must hook with a stat or contrarian take tied to ${d.name}'s mission. Tweet 8 must CTA to the sale on ${d.chain || "chain"}.

\`## Telegram Announcement\`
3-4 short paragraphs with relevant emojis (no spam). Mention ${d.name}, the token (${d.token}), and ${d.maxSupply ? `the ${d.maxSupply} cap` : "the supply cap"}. End with a CTA link placeholder \`{{sale_url}}\`.

\`## Discord Community Post\`
Open with \`@everyone\`, then a punchy headline, then 3 bullets (product, token utility, community perk), then one open question inviting ${d.audience} to reply.`,

  deck: `${projectContext(d)}${formatRules(d)}

Produce a 10-slide investor pitch deck for ${d.name}, calibrated for a ${d.raiseSize || "seed/strategic"} round at the ${d.stage || "current"} stage.

For EACH slide use exactly:

\`### Slide N — Title\`
**Headline:** one punchy line referencing ${d.name}

**Key points:**
- bullet (concrete, numeric where possible)
- bullet
- bullet

**Speaker notes:** 2-3 sentences a founder would actually say.

**Image prompt:** detailed visual brief (style, subject, palette).

---

Slides: 1 Cover, 2 Problem (for ${d.audience}), 3 Solution, 4 Market (size + wedge), 5 Product, 6 Tokenomics (cite max supply${d.maxSupply ? ` ${d.maxSupply}` : ""}), 7 Traction, 8 Roadmap, 9 Team, 10 Ask (state the ${d.raiseSize || "raise"} amount and use-of-funds split).`,

  emails: `${projectContext(d)}${formatRules(d)}

Produce three sections, each tailored to ${d.name}'s ${d.stage || "stage"} and ${d.raiseSize || "raise"}:

\`## 1. Cold Investor Email\`
**Subject:** sharp, curiosity-driven, mentions ${d.name} or the wedge — not "Investment opportunity"
**Body:** 120-160 words. Open with a referral hook, then 2 sentences on the problem for ${d.audience}, 2 sentences on ${d.name}'s edge on ${d.chain || "chain"}, one traction line, then a soft CTA for a 20-min call.

\`## 2. Follow-up Email (Day 5)\`
**Subject:** short, adds new info (a milestone, partnership, or metric).
**Body:** 80-110 words referencing the prior email.

\`## 3. Target Investor List\`
Markdown table \`| Firm / Archetype | Stage focus | Thesis fit | Why ${d.name} | Contact angle |\` with 8 rows. Each "Why ${d.name}" cell MUST cite a specific reason (portfolio overlap, chain thesis, audience fit) — no generic "interested in Web3".`,

  calendar: `${projectContext(d)}${formatRules(d)}

Produce a 7-DAY (one-week) launch-week community engagement calendar for ${d.name} targeting ${d.audience} on ${d.chain || "its chain"}. Every row must be crypto-native, deeply tailored to ${d.name}'s mission, token (${d.token}), and audience — NO generic marketing filler ("engage with community", "post a meme", "share update").

\`# ${d.name} — Launch Week Calendar (7 Days)\`

Return ONE Markdown table with these columns and EXACTLY 7 rows:

\`| Day | Channel | Content Type | Crypto-Native Topic | Copy Hook (≤200 chars) | CTA | Authentic Link |\`

Strict rules:
- Day = 1..7 (Mon → Sun of launch week)
- Channel: pick the BEST single channel per day from { X (Twitter), Telegram, Discord, Farcaster, Medium/Mirror, Galxe, CoinGecko/CoinMarketCap, DexScreener } — do NOT just rotate; match channel to content.
- Content Type: pick crypto-native formats: Spaces AMA, on-chain proof post, liquidity-pool announcement, audit report drop, governance proposal, KOL co-tweet, points/quest campaign, listing announcement, dev changelog, tokenomics deep-dive, holder airdrop snapshot reminder.
- Crypto-Native Topic MUST reference ${d.name}, the ${d.token} utility, ${d.chain || "chain"} specifics (gas, bridges, DEXs available there), ${d.maxSupply ? `the ${d.maxSupply} supply cap, ` : ""}and what ${d.audience} actually cares about (yield, points, governance, alpha).
- Copy Hook = the actual post text a community manager would publish. Include real-sounding numbers, on-chain references, or mechanics — not "join us today!".
- CTA = concrete verb + measurable action (e.g. "Bridge USDC via Across to ${d.chain || "chain"}", "Stake ${d.token} for week-1 multiplier", "Vote on Snapshot proposal #1").
- Authentic Link = a REAL working URL on the canonical domain for that tool/channel, parameterised with ${d.name} where natural. Examples of acceptable real domains:
  - https://x.com/search?q=%24${d.token}
  - https://app.uniswap.org/swap?chain=${(d.chain || "ethereum").toLowerCase()}
  - https://dexscreener.com/${(d.chain || "ethereum").toLowerCase()}
  - https://www.coingecko.com/en/coins/${d.name.toLowerCase().replace(/\s+/g, "-")}
  - https://snapshot.org/#/${d.name.toLowerCase().replace(/\s+/g, "-")}.eth
  - https://galxe.com/${d.name.replace(/\s+/g, "")}
  - https://warpcast.com/~/channel/${d.name.toLowerCase().replace(/\s+/g, "-")}
  - https://mirror.xyz/${d.name.toLowerCase().replace(/\s+/g, "")}.eth
  - https://debank.com/ , https://defillama.com/protocol/${d.name.toLowerCase().replace(/\s+/g, "-")}
   Use the correct domain for the chain (e.g. basescan.org for Base, arbiscan.io for Arbitrum, etherscan.io for Ethereum, solscan.io for Solana). NEVER invent a domain. NEVER use example.com or {{placeholder}}.

Below the table add:

\`## Week Narrative Arc\`
3 sentences explaining how Days 1→7 escalate (awareness → proof → conversion) for ${d.name} specifically.

\`## Asset Checklist\`
Bullet list of the exact assets the team must prep before Monday (graphics dimensions, AMA host, audit PDF link target, contract address placeholder, etc.) — tailored to ${d.name}'s stage (${d.stage || "launch"}).`,

  community: `${projectContext(d)}${formatRules(d)}

You are ${d.name}'s COMMUNITY GROWTH AGENT. Produce 7 days of ready-to-publish community posts whose single goal is GROWING the ${d.name} community (members, active chatters, retained holders) across Telegram, Discord, Reddit, X and Farcaster. Every post must be fully written and publishable as-is — no briefs, no "share an update" filler.

\`# ${d.name} — 7-Day Community Growth Agent\`

\`## Growth Thesis\`
3 sentences: where ${d.audience} currently hangs out, which platform is the acquisition engine vs the retention home for ${d.name}, and the one growth loop being run this week.

Then for EACH day output exactly this block (Day 1 → Day 7):

\`### Day N — <Growth objective> (<Primary platform>)\`

**Telegram post:** full copy, 60-120 words, 2-4 tasteful emojis, one clear ask (invite / react / answer), ends with a pinned-message-friendly line.

**Discord post:** full copy for a specific named channel (e.g. \`#alpha-lounge\`, \`#gm\`, \`#governance\`) — include the channel name, a role ping choice (@everyone only when justified), 3 bullets, and one thread-starter question for ${d.audience}.

**Reddit post:** target subreddit (a REAL one that fits ${d.name}, e.g. r/CryptoCurrency, r/CryptoMoonShots, r/ethdev, r/defi, r/solana — pick by relevance and respect their self-promo norms), a title ≤ 300 chars written like a native redditor (no shilling), and a 100-150 word body that leads with value/analysis and mentions ${d.name} only as context.

**X / Farcaster post:** ≤ 270 chars, hook-first, no hashtag spam.

**Growth mechanic:** the specific loop for that day (invite contest, referral code, quest on Galxe, points multiplier, AMA, meme bounty, mod recruitment, holder-only channel unlock) with the exact rule and reward denominated in ${d.token}.

**Real link:** one REAL working URL on a canonical domain, parameterised for ${d.name} where natural (e.g. https://t.me/, https://discord.gg/, https://www.reddit.com/r/<sub>/, https://galxe.com/${d.name.replace(/\s+/g, "")}, https://warpcast.com/~/channel/${d.name.toLowerCase().replace(/\s+/g, "-")}, https://snapshot.org/#/${d.name.toLowerCase().replace(/\s+/g, "-")}.eth, https://dexscreener.com/${(d.chain || "ethereum").toLowerCase()}). Never invent a domain, never use example.com or placeholders.

**Success metric:** one measurable target (e.g. "+120 TG members", "40 new Discord verifications", "300 upvotes / 25 comments").

---

After Day 7 add:

\`## Moderation & Safety Notes\`
4 bullets on scam-bot defence, verification flow, DM-scam warnings, and tone rules for mods — specific to ${d.chain || "the chain"} and ${d.audience}.

\`## Week KPI Table\`
Markdown table \`| Day | Platform | Growth mechanic | Target metric | Owner |\` with exactly 7 rows matching the days above.`,

  growth: `${projectContext(d)}${formatRules(d)}

You are ${d.name}'s CRYPTO GROWTH INTELLIGENCE AGENT. Traditional marketing playbooks fail in crypto: incentives get farmed, timing is dictated by market cycles and chain activity, and audiences are segmented by on-chain behaviour, not demographics. Produce a data-driven growth intelligence report for ${d.name} ($${d.token}) on ${d.chain || "its chain"} for the audience "${d.audience}". Everything must be specific, quantified and executable — no generic marketing advice, no placeholders.

Calibrate the ENTIRE report to these three inputs, and reference them explicitly in every section:
- Launch stage: ${d.stage || "unspecified — assume public sale prep"}. Timing windows, event sequencing and which experiments are even legal/sensible at this stage must follow from it (pre-seed = private-channel trust building, no public airdrop; private sale = allocation scarcity and vetted-investor AMAs; public sale / IDO prep = claim mechanics, listing timing, liquidity depth; post-launch = retention, emissions cuts, governance activation).
- Target raise: ${d.raiseSize || "unspecified"}. Every incentive budget, reward pool size, cost-per-retained-holder figure, ambassador stipend and experiment sample size must be sized as a stated % of this raise and must total within it. Show the arithmetic.
- Brand voice & guidelines: ${d.brand || "no explicit guidelines — infer a confident, technical, non-hyped crypto voice"}. All announcement framing, AMA talking points and incentive names must obey this voice (respect banned words and key phrases if given), and say in one line per section how the voice shapes the wording.${d.maxSupply ? `\n- Max supply: ${d.maxSupply}. Denominate every ${d.token} reward as an absolute amount AND a % of max supply.` : ""}

\`# ${d.name} — Growth Intelligence Report\`

\`## 1. Why Traditional Tactics Fail Here\`
5 bullets contrasting a standard SaaS/consumer tactic with what actually works for ${d.audience} in crypto, each naming the failure mechanism (mercenary liquidity, airdrop farming, sybil accounts, bot-inflated Discords, paid-ad bans).

\`## 2. Comparable Project Pattern Analysis\`
Table \`| Comparable project | Chain / category | Growth play that worked | Mechanism behind it | Result (est.) | What ${d.name} should copy | What to avoid |\` with 6 rows naming real, well-known projects in ${d.chain || "the ecosystem"} or adjacent categories. Estimates must be labelled as estimates.

\`## 3. Extracted Growth Patterns\`
5 numbered patterns distilled from section 2. Each: pattern name, the precondition that makes it work, the leading indicator that shows it is working, and the failure signature.

\`## 4. Optimal Timing Model\`
Table \`| Event | Recommended window (week + weekday + UTC hour) | Stage fit (${d.stage || "current stage"}) | Why this timing | Market/on-chain precondition | Blackout windows | Budget (% of ${d.raiseSize || "raise"}) | Leading KPI |\` with rows for: airdrop / claim opening, second airdrop tranche, AMA (X Spaces), AMA (Telegram), partnership announcement #1, partnership announcement #2, listing/liquidity event, and governance vote. Anchor week numbers to the ${d.stage || "current"} stage timeline; mark any event that should be deferred to a later stage as "Defer — <stage>". Timing reasoning must reference ${d.audience} activity, ${d.chain || "chain"} gas/liquidity conditions and crypto news cycles. Below the table, write 3 announcement headlines in the brand voice for the two partnership slots and the claim opening.

\`## 5. Community Segmentation Model\`
Table \`| Segment | On-chain / behavioural definition (queryable) | Est. share of audience | Motivation | Best incentive | Predicted response rate | Churn/farm risk | Channel |\` with 7 segments (e.g. long-term holders, LP providers, active governance voters, dormant claimers, airdrop farmers, builders/devs, lurkers). Definitions must be written so a data team could query them (wallet age, balance bands, tx counts, contract interactions, holding duration). Note which segments barely exist yet at the ${d.stage || "current"} stage and what proxy signal to use instead.

\`## 6. Incentive → Segment Response Prediction\`
Table \`| Incentive | Best-fit segments | Budget (absolute + % of ${d.raiseSize || "raise"}) | Predicted response rate (est.) | Predicted retention at 30 days | Cost per retained holder (est.) | Sybil/farm exposure | Stage verdict (scale / test / drop / defer) |\` with 8 incentive types (points program, retro airdrop, staking boost, NFT badge, referral multiplier, quest campaign, fee rebate, ambassador stipend). Budgets must sum to a stated total and stay inside the ${d.raiseSize || "raise"} envelope — show the total row. Name each incentive/program in the brand voice.

\`## 7. Automated Audience Segmentation Pipeline\`Numbered 6-step pipeline describing how segments are built and refreshed automatically: data sources (chain indexer, wallet snapshots, Discord/Telegram roles, site analytics), the join key, refresh cadence, scoring formula (write the actual formula with weights), the sybil filter rules, and how segments sync into campaign tooling.

\`## 8. Growth Experiment Backlog\`
Table \`| # | Hypothesis | Target segment | Incentive/lever | Budget | Sample size | Control | Primary metric | MDE | Duration | Priority |\` with exactly 8 rows, ranked by fit to the ${d.stage || "current"} stage. Hypotheses written as "If we X for Y, then Z will improve by N%". Sample sizes must be realistic for a ${d.raiseSize || "raise"}-sized community.

\`## 9. Anti-Farming & Quality Guardrails\`
6 bullets: sybil clustering, minimum activity gates, vesting/claim decay, wallet-age weighting, per-segment caps, and detection alerts with thresholds.

\`## 10. 90-Day Growth Roadmap & KPIs\`
Table \`| Phase | Weeks | Experiments running | Segment focus | Budget spend (% of ${d.raiseSize || "raise"}) | Primary KPI | Target | Kill criteria |\` with 3 phases sequenced from the ${d.stage || "current"} stage, then 4 bullets on the reporting cadence and who owns each number, plus one closing bullet stating the total growth budget as a % of the ${d.raiseSize || "raise"} and what is held in reserve.`,

  seo: `${projectContext(d)}${formatRules(d)}

You are ${d.name}'s senior crypto SEO strategist. Produce a COMPLETE, execution-ready SEO plan for ${d.name} — covering keyword research, technical SEO, on-page, content, off-page, local/AI search and measurement. Everything must be specific to ${d.name}, ${d.token}, ${d.chain || "its chain"} and the audience "${d.audience}". No generic SEO advice, no placeholders.

\`# ${d.name} — Full SEO Plan\`

\`## 1. Executive Summary & SEO Goals\`
4-6 bullets: current stage (${d.stage || "launch"}), the search opportunity, the 90-day target (traffic, rankings, conversions to ${d.token} sale / waitlist), and the single biggest constraint.

\`## 2. Search Intent & Audience Map\`
Markdown table \`| Audience segment | Stage of journey | Search intent | Example query | Page that should win it |\` with 6 rows for ${d.audience}.

\`## 3. Keyword Universe (core deliverable)\`
Four separate tables, each column set: \`| Keyword | Intent | Est. monthly volume | Difficulty (1-100) | Priority (P1-P3) | Target page/URL slug |\`
- \`### 3.1 Primary / head terms\` — 8 rows (brand + category terms, e.g. "${d.name}", "$${d.token}" style queries).
- \`### 3.2 Secondary / commercial\` — 10 rows (buy, price, presale, staking, tokenomics, audit, how to buy on ${d.chain || "chain"}).
- \`### 3.3 Long-tail & question keywords\` — 12 rows written as real questions ${d.audience} type.
- \`### 3.4 Competitor gap keywords\` — 8 rows, each naming a plausible competing project/category page and the angle to beat it.
Volumes and difficulty must be realistic estimates and internally consistent; label the column header with "(estimate)".

\`## 4. Keyword Clusters → Site Architecture\`
Table \`| Cluster | Pillar page | Supporting pages (3) | Internal-link rule |\` with 5 clusters. Include the exact URL slugs.

\`## 5. On-Page Blueprints\`
For the 5 highest-priority pages give: URL slug, title tag (≤60 chars, with keyword), meta description (≤155 chars), single H1, H2 outline (4-6), target word count, schema type to use, and the primary CTA.

\`## 6. Technical SEO Checklist\`
Table \`| Item | Why it matters for ${d.name} | Action | Owner | Priority |\` with 12 rows covering Core Web Vitals, mobile, crawl/indexation, XML sitemap, robots.txt, canonicals, hreflang (if relevant), JS rendering of the dApp, HTTPS/security headers, structured data (Organization, FAQ, Product/Token, BreadcrumbList), pagination, and 404/redirect hygiene.

\`## 7. Content Calendar — First 8 Weeks\`
Table \`| Week | Content title | Format | Target keyword | Search intent | Word count | Distribution channel |\` with exactly 8 rows, titles written as publishable headlines about ${d.name}/${d.chain || "chain"} topics.

\`## 8. Off-Page & Authority Plan\`
Table \`| Tactic | Target site type (real examples) | Anchor/topic | Expected DR range | Effort |\` with 8 rows — crypto-native only (CoinGecko/CMC listings, DeFiLlama, chain ecosystem pages, dev docs, PR wires, podcasts, Mirror/Medium syndication, GitHub/awesome lists). Name real canonical domains, never invented ones.

\`## 9. AI Search & LLM Visibility (2026)\`
5 bullets on being cited by AI answer engines: entity/knowledge-graph consistency, llms.txt, FAQ schema, third-party corroboration of ${d.name}'s facts, and structured tokenomics data.

\`## 10. Measurement & KPIs\`
Table \`| KPI | Baseline assumption | 30-day target | 90-day target | Tool |\` with 8 rows (impressions, non-brand clicks, avg. position for P1 keywords, indexed pages, referring domains, organic conversions, CWV pass rate, AI citations).

\`## 11. 90-Day Roadmap\`
Table \`| Phase | Weeks | Focus | Deliverables | Success gate |\` with 3 phases.

\`## 12. Risks & Guardrails\`
5 bullets on crypto-specific SEO risks (YMYL/financial scrutiny, ad-policy limits, thin token pages, spam link vendors, regulatory wording for a ${d.raiseSize || "raise"}).`,
});

/**
 * The SEO and Community documents are far too long for one model call — a single
 * request runs past the request timeout and the user sees a generic failure.
 * Split those into two sequential passes and stitch the Markdown back together.
 */
function promptPasses(d: z.infer<typeof projectSchema>, kind: string): string[] {
  const full = (textPrompts(d) as Record<string, string>)[kind]!;
  const head = `${projectContext(d)}${formatRules(d)}`;
  const cont = (what: string) =>
    `${head}

You are continuing an existing Markdown document for ${d.name}. Do NOT repeat the H1 title, any earlier section, any intro, or a closing summary. Output ONLY the following, starting directly with its heading:

${what}`;

  if (kind === "growth") {
    const g = full.indexOf("`## 6. Incentive");
    if (g > 0) {
      return [
        `${full.slice(0, g)}\n\nStop after section 5. Do NOT output sections 6-10.`,
        cont(full.slice(g)),
      ];
    }
    return [full];
  }

  if (kind === "seo") {
    const i = full.indexOf("`## 7. Content Calendar");
    if (i < 0) return [full];
    return [
      `${full.slice(0, i)}\n\nStop after section 6. Do NOT output sections 7-12.`,
      cont(full.slice(i)),
    ];
  }

  if (kind === "community") {
    const dayStart = full.indexOf("`### Day N");
    const tailStart = full.indexOf("After Day 7 add:");
    const blockEnd = full.indexOf("---", dayStart);
    if (dayStart < 0 || tailStart < 0 || blockEnd < 0) return [full];
    const block = full.slice(dayStart, blockEnd).trim();
    const tail = full.slice(tailStart + "After Day 7 add:".length).trim();
    return [
      `${full.slice(0, tailStart).replace("(Day 1 → Day 7)", "(Day 1 → Day 4)")}
Stop after Day 4. Do NOT output the Moderation or KPI sections yet.`,
      cont(`Day 5, Day 6 and Day 7 — each using EXACTLY this block format:

${block}

Then add:

${tail}`),
    ];
  }

  return [full];
}

export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { userId, supabase } = context;
    let result: { kind: string; content: Json };

    if (data.kind === "tokenomics") {
      const output = await withFallback(async (model) => {
        const res = await generateText({
          model,
          output: Output.object({
            schema: z.object({
              allocations: z.array(z.object({ category: z.string(), percent: z.number(), vestingMonths: z.number() })),
              emissions: z.array(z.object({ month: z.number(), circulating: z.number() })),
              summary: z.string(),
            }),
          }),
          prompt: `${projectContext(data)}

Design a tokenomics model SPECIFIC to ${data.name} on ${data.chain || "its chain"} for a ${data.stage || "launch"} targeting ${data.raiseSize || "an undisclosed raise"}.

Return STRICT JSON with:
- "allocations": 5-7 objects {category, percent (0-100), vestingMonths (int)}. Percentages MUST sum to exactly 100. Categories must reflect ${data.name}'s actual go-to-market (e.g. liquidity, ecosystem incentives matching the audience "${data.audience}", team, treasury, public sale, advisors). Vesting schedules must reflect ${data.stage || "the stage"} — longer cliffs for team, shorter for liquidity.
- "emissions": exactly 24 monthly points {month: 1-24, circulating: millions}. The month-24 value MUST equal (or be ≤) the project's max supply${data.maxSupply ? ` of ${data.maxSupply}` : ""} in millions. Curve must reflect the vesting schedules in "allocations".
- "summary": 2-3 sentences naming ${data.name}, the chain, and the strategic logic — NOT generic.

Return only the JSON object.`,
        });
        return res.output;
      });
      result = { kind: "tokenomics", content: output };
    } else if (data.kind === "sentiment") {
      const output = await withFallback(async (model) => {
        const res = await generateText({
          model,
          output: Output.object({
            schema: z.object({
              score: z.number().min(-1).max(1),
              label: z.enum(["bearish", "neutral", "bullish"]),
              risks: z.array(z.string()).max(5),
              suggestions: z.array(z.string()).max(5),
            }),
          }),
          prompt: `Analyze sentiment of this ${data.name} post for the audience "${data.audience}". Flag regulatory/PR risks specific to ${data.chain || "the chain"} and ${data.stage || "launch stage"}.

POST:
${data.extra}`,
        });
        return res.output;
      });
      result = { kind: "sentiment", content: output };
    } else {
      await deductCredits(supabase, userId, data.kind as CreditKind);
      const passes = promptPasses(data, data.kind);
      const sections: string[] = [];
      for (const prompt of passes) {
        const part = await withFallback(async (model) => {
          const res = await generateText({
            model,
            prompt,
            abortSignal: AbortSignal.timeout(80_000),
          });
          if (!res.text?.trim()) throw new Error("Empty response");
          return res.text.trim();
        });
        sections.push(part);
      }
      result = { kind: data.kind, content: sections.join("\n\n") };
    }


    // Save generation snapshot
    let projectId = data.projectId;
    if (!projectId) {
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      projectId = existing?.id;
    }
    if (projectId) {
      const { error: genErr } = await supabase.from("generations").insert({
        user_id: userId,
        project_id: projectId,
        kind: result.kind,
        content: result.content as never,
      });
      if (genErr) {
        console.error("generations insert error", genErr);
      }
    }

    return result;
  });
