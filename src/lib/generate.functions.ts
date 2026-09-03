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
  kind: z.enum(["whitepaper", "social", "deck", "emails", "tokenomics", "calendar", "community", "sentiment"]),
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
});

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
      const text = await withFallback(async (model) => {
        const prompts = textPrompts(data) as Record<string, string>;
        const res = await generateText({ model, prompt: prompts[data.kind]! });
        if (!res.text?.trim()) throw new Error("Empty response");
        return res.text;
      });
      result = { kind: data.kind, content: text };
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
