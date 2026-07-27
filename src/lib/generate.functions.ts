import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COSTS, chargeCredits } from "@/lib/credits.functions";
import type { Project } from "@/hooks/use-project";

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
  kind: z.enum(["whitepaper", "social", "deck", "emails", "tokenomics", "calendar", "sentiment"]),
  extra: z.string().max(2000).optional().default(""),
});

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const gemini = createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    headers: { Authorization: `Bearer ${key}` },
  });
  return gemini("gemini-2.5-flash");
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

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data }) => {
    const model = getModel();
    const ctx = projectContext(data);

    if (data.kind === "tokenomics") {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: z.object({
            allocations: z.array(z.object({ category: z.string(), percent: z.number(), vestingMonths: z.number() })),
            emissions: z.array(z.object({ month: z.number(), circulating: z.number() })),
            summary: z.string(),
          }),
        }),
        prompt: `${ctx}

Design a tokenomics model SPECIFIC to ${data.name} on ${data.chain || "its chain"} for a ${data.stage || "launch"} targeting ${data.raiseSize || "an undisclosed raise"}.

Return STRICT JSON with:
- "allocations": 5-7 objects {category, percent (0-100), vestingMonths (int)}. Percentages MUST sum to exactly 100. Categories must reflect ${data.name}'s actual go-to-market (e.g. liquidity, ecosystem incentives matching the audience "${data.audience}", team, treasury, public sale, advisors). Vesting schedules must reflect ${data.stage || "the stage"} — longer cliffs for team, shorter for liquidity.
- "emissions": exactly 24 monthly points {month: 1-24, circulating: millions}. The month-24 value MUST equal (or be ≤) the project's max supply${data.maxSupply ? ` of ${data.maxSupply}` : ""} in millions. Curve must reflect the vesting schedules in "allocations".
- "summary": 2-3 sentences naming ${data.name}, the chain, and the strategic logic — NOT generic.

Return only the JSON object.`,
      });
      return { kind: "tokenomics" as const, data: output };
    }

    if (data.kind === "sentiment") {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: z.object({
            score: z.number().min(-1).max(1),
            label: z.enum(["bearish", "neutral", "bullish"]),
            risks: z.array(z.string()).max(5),
            suggestions: z.array(z.string()).max(5),
          }),
        }),
        prompt: `Analyze sentiment of this ${data.name} post for the audience "${data.audience}". Flag regulatory/PR risks specific to ${data.chain || "the chain"} and ${data.stage || "launch stage"}.\n\nPOST:\n${data.extra}`,
      });
      return { kind: "sentiment" as const, data: output };
    }

    const formatRules = `\n\nFORMATTING RULES (mandatory):
- Output GitHub-Flavored Markdown only. No code fences around the whole document.
- Start with a single \`#\` H1 title that includes "${data.name}". Use \`##\` for sections, \`###\` for subsections.
- Use real Markdown tables (header row + separator) wherever data is comparative.
- Use bullet/numbered lists with consistent indentation. Bold key terms with **...**.
- Insert blank lines between every heading, paragraph, list, and table.
- No raw HTML, no emoji-only lines, no "[insert here]" placeholders — every value must be specific to ${data.name}.`;

    const prompts: Record<string, string> = {
      whitepaper: `${ctx}${formatRules}

Write a professional whitepaper (~1800 words) for ${data.name} on ${data.chain || "its chain"}. Each section must reference ${data.name}'s actual mission and audience — no generic crypto prose.

Sections in order:
1. \`# ${data.name} Whitepaper\` (subtitle: one-line positioning derived from the mission)
2. \`## Abstract\` — 3-5 sentences naming ${data.name}, the problem, the audience "${data.audience}", and the token (${data.token}).
3. \`## 1. Introduction\` — why ${data.name} now, grounded in market context.
4. \`## 2. Problem Statement\` — 3 concrete pains felt by ${data.audience}.
5. \`## 3. Solution & Product\` — ${data.name}'s product surface and core flows.
6. \`## 4. Technology Architecture\` — modules, ${data.chain || "chain"} choice rationale, security model.
7. \`## 5. Tokenomics\` — Markdown table \`| Allocation | % | Vesting | Purpose |\` summing to 100%. Max supply: ${data.maxSupply || "propose a credible figure and reuse it"}.
8. \`## 6. Roadmap\` — Markdown table \`| Quarter | Milestone | KPI |\` covering the next 6 quarters from ${data.stage || "current stage"}.
9. \`## 7. Team & Advisors\` — 4-6 realistic archetype roles tied to ${data.name}'s needs (no real names; use "Co-founder & CEO — ex-...").
10. \`## 8. Risk Factors\` — 5 risks specific to ${data.chain || "the chain"}, ${data.audience}, and token utility.
11. \`## 9. Legal Disclaimer\` — tailored to a ${data.raiseSize || "private/public"} raise.`,

      social: `${ctx}${formatRules}

Produce launch-day content for ${data.name}. Voice MUST match the audience "${data.audience}" and the brand guidelines above.

\`# ${data.name} Launch Pack\`

\`## X / Twitter Thread\`
Exactly 8 tweets numbered \`1/8\` … \`8/8\`, each on its own line, ≤ 270 chars. Tweet 1 must hook with a stat or contrarian take tied to ${data.name}'s mission. Tweet 8 must CTA to the sale on ${data.chain || "chain"}.

\`## Telegram Announcement\`
3-4 short paragraphs with relevant emojis (no spam). Mention ${data.name}, the token (${data.token}), and ${data.maxSupply ? `the ${data.maxSupply} cap` : "the supply cap"}. End with a CTA link placeholder \`{{sale_url}}\`.

\`## Discord Community Post\`
Open with \`@everyone\`, then a punchy headline, then 3 bullets (product, token utility, community perk), then one open question inviting ${data.audience} to reply.`,

      deck: `${ctx}${formatRules}

Produce a 10-slide investor pitch deck for ${data.name}, calibrated for a ${data.raiseSize || "seed/strategic"} round at the ${data.stage || "current"} stage.

For EACH slide use exactly:

\`### Slide N — Title\`
**Headline:** one punchy line referencing ${data.name}

**Key points:**
- bullet (concrete, numeric where possible)
- bullet
- bullet

**Speaker notes:** 2-3 sentences a founder would actually say.

**Image prompt:** detailed visual brief (style, subject, palette).

---

Slides: 1 Cover, 2 Problem (for ${data.audience}), 3 Solution, 4 Market (size + wedge), 5 Product, 6 Tokenomics (cite max supply${data.maxSupply ? ` ${data.maxSupply}` : ""}), 7 Traction, 8 Roadmap, 9 Team, 10 Ask (state the ${data.raiseSize || "raise"} amount and use-of-funds split).`,

      emails: `${ctx}${formatRules}

Produce three sections, each tailored to ${data.name}'s ${data.stage || "stage"} and ${data.raiseSize || "raise"}:

\`## 1. Cold Investor Email\`
**Subject:** sharp, curiosity-driven, mentions ${data.name} or the wedge — not "Investment opportunity"
**Body:** 120-160 words. Open with a referral hook, then 2 sentences on the problem for ${data.audience}, 2 sentences on ${data.name}'s edge on ${data.chain || "chain"}, one traction line, then a soft CTA for a 20-min call.

\`## 2. Follow-up Email (Day 5)\`
**Subject:** short, adds new info (a milestone, partnership, or metric).
**Body:** 80-110 words referencing the prior email.

\`## 3. Target Investor List\`
Markdown table \`| Firm / Archetype | Stage focus | Thesis fit | Why ${data.name} | Contact angle |\` with 8 rows. Each "Why ${data.name}" cell MUST cite a specific reason (portfolio overlap, chain thesis, audience fit) — no generic "interested in Web3".`,

      calendar: `${ctx}${formatRules}

Produce a 7-DAY (one-week) launch-week community engagement calendar for ${data.name} targeting ${data.audience} on ${data.chain || "its chain"}. Every row must be crypto-native, deeply tailored to ${data.name}'s mission, token (${data.token}), and audience — NO generic marketing filler ("engage with community", "post a meme", "share update").

\`# ${data.name} — Launch Week Calendar (7 Days)\`

Return ONE Markdown table with these columns and EXACTLY 7 rows:

\`| Day | Channel | Content Type | Crypto-Native Topic | Copy Hook (≤200 chars) | CTA | Authentic Link |\`

Strict rules:
- Day = 1..7 (Mon → Sun of launch week)
- Channel: pick the BEST single channel per day from { X (Twitter), Telegram, Discord, Farcaster, Medium/Mirror, Galxe, CoinGecko/CoinMarketCap, DexScreener } — do NOT just rotate; match channel to content.
- Content Type: pick crypto-native formats: Spaces AMA, on-chain proof post, liquidity-pool announcement, audit report drop, governance proposal, KOL co-tweet, points/quest campaign, listing announcement, dev changelog, tokenomics deep-dive, holder airdrop snapshot reminder.
- Crypto-Native Topic MUST reference ${data.name}, the ${data.token} utility, ${data.chain || "chain"} specifics (gas, bridges, DEXs available there), ${data.maxSupply ? `the ${data.maxSupply} supply cap, ` : ""}and what ${data.audience} actually cares about (yield, points, governance, alpha).
- Copy Hook = the actual post text a community manager would publish. Include real-sounding numbers, on-chain references, or mechanics — not "join us today!".
- CTA = concrete verb + measurable action (e.g. "Bridge USDC via Across to ${data.chain || "chain"}", "Stake ${data.token} for week-1 multiplier", "Vote on Snapshot proposal #1").
- Authentic Link = a REAL working URL on the canonical domain for that tool/channel, parameterised with ${data.name} where natural. Examples of acceptable real domains:
  - https://x.com/search?q=%24${data.token}
  - https://app.uniswap.org/swap?chain=${(data.chain || "ethereum").toLowerCase()}
  - https://dexscreener.com/${(data.chain || "ethereum").toLowerCase()}
  - https://www.coingecko.com/en/coins/${data.name.toLowerCase().replace(/\s+/g, "-")}
  - https://snapshot.org/#/${data.name.toLowerCase().replace(/\s+/g, "-")}.eth
  - https://galxe.com/${data.name.replace(/\s+/g, "")}
  - https://warpcast.com/~/channel/${data.name.toLowerCase().replace(/\s+/g, "-")}
  - https://mirror.xyz/${data.name.toLowerCase().replace(/\s+/g, "")}.eth
  - https://debank.com/ , https://defillama.com/protocol/${data.name.toLowerCase().replace(/\s+/g, "-")}
  Use the correct domain for the chain (e.g. basescan.org for Base, arbiscan.io for Arbitrum, etherscan.io for Ethereum, solscan.io for Solana). NEVER invent a domain. NEVER use example.com or {{placeholder}}.

Below the table add:

\`## Week Narrative Arc\`
3 sentences explaining how Days 1→7 escalate (awareness → proof → conversion) for ${data.name} specifically.

\`## Asset Checklist\`
Bullet list of the exact assets the team must prep before Monday (graphics dimensions, AMA host, audit PDF link target, contract address placeholder, etc.) — tailored to ${data.name}'s stage (${data.stage || "launch"}).`,
    };


    const { text } = await generateText({
      model,
      prompt: prompts[data.kind],
    });
    return { kind: data.kind, text };
  });
