import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  mission: z.string().min(1).max(2000),
  audience: z.string().min(1).max(500),
  token: z.string().min(1).max(1000),
  brand: z.string().max(3000).optional().default(""),
  kind: z.enum(["whitepaper", "social", "deck", "emails", "tokenomics", "calendar", "sentiment"]),
  extra: z.string().max(2000).optional().default(""),
});

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)("google/gemini-2.5-pro");
}

const brandPreamble = (b: string) =>
  b ? `\n\nBRAND VOICE GUIDELINES (must be followed strictly):\n${b}\n` : "";

const projectContext = (d: z.infer<typeof projectSchema>) =>
  `PROJECT: ${d.name}\nMISSION: ${d.mission}\nAUDIENCE: ${d.audience}\nTOKEN DETAILS: ${d.token}${brandPreamble(d.brand)}`;

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
        prompt: `${ctx}\n\nDesign a realistic tokenomics model. Return STRICT JSON with:\n- "allocations": array of 5-7 objects, each {category: string, percent: number 0-100, vestingMonths: integer}. Percentages must sum to 100.\n- "emissions": array of exactly 24 objects, each {month: integer 1-24, circulating: number in millions}.\n- "summary": 2-3 sentence strategist note.\nReturn only the JSON object, no prose.`,
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
        prompt: `Analyze sentiment of the following crypto post for investor reception. Identify regulatory/PR risks.\n\nPOST:\n${data.extra}`,
      });
      return { kind: "sentiment" as const, data: output };
    }

    const formatRules = `\n\nFORMATTING RULES (mandatory):\n- Output GitHub-Flavored Markdown only. No code fences around the whole document.\n- Start with a single \`#\` H1 title. Use \`##\` for sections, \`###\` for subsections.\n- Use real Markdown tables (with header row + separator) where data is comparative.\n- Use bullet/numbered lists with consistent indentation. Bold key terms with **...**.\n- Insert blank lines between every heading, paragraph, list, and table.\n- No raw HTML. No placeholder text like "[insert here]" — invent realistic, specific values.\n- Be factually grounded and internally consistent (numbers, dates, percentages must add up).`;

    const prompts: Record<string, string> = {
      whitepaper: `${ctx}${formatRules}\n\nWrite a professional ICO whitepaper (~1800 words) with these sections in order:\n1. # ${data.name} Whitepaper  \n2. ## Abstract (3-5 sentences)\n3. ## 1. Introduction\n4. ## 2. Problem Statement\n5. ## 3. Solution & Product\n6. ## 4. Technology Architecture\n7. ## 5. Tokenomics — include a Markdown table: Allocation | % | Vesting | Purpose\n8. ## 6. Roadmap — Markdown table: Quarter | Milestone | KPI\n9. ## 7. Team & Advisors (placeholder roles)\n10. ## 8. Risk Factors\n11. ## 9. Legal Disclaimer`,
      social: `${ctx}${formatRules}\n\nProduce launch-day content with these exact sections:\n# ${data.name} Launch Pack\n## X / Twitter Thread\nNumbered 1/8 through 8/8, each tweet on its own line, ≤ 270 chars, hook → value → CTA.\n## Telegram Announcement\n3-4 short paragraphs with emojis and a clear CTA link placeholder.\n## Discord Community Post\nWith @everyone ping, headline, 3 bullet highlights, and a community question.`,
      deck: `${ctx}${formatRules}\n\nProduce a 10-slide investor pitch deck. For EACH slide use this exact structure:\n\n### Slide N — Title\n**Headline:** one punchy line\n\n**Key points:**\n- bullet\n- bullet\n- bullet\n\n**Speaker notes:** 2-3 sentences\n\n**Image prompt:** detailed visual brief\n\n---\n\nSlides: 1 Cover, 2 Problem, 3 Solution, 4 Market, 5 Product, 6 Tokenomics, 7 Traction, 8 Roadmap, 9 Team, 10 Ask.`,
      emails: `${ctx}${formatRules}\n\nProduce three sections:\n## 1. Cold Investor Email\n**Subject:** ...\n**Body:** ...\n## 2. Follow-up Email (Day 5)\n**Subject:** ...\n**Body:** ...\n## 3. Target Investor List\nMarkdown table: Firm/Archetype | Stage | Thesis Fit | Why ${data.name} | Contact Angle — 8 rows of realistic, well-reasoned targets.`,
      calendar: `${ctx}${formatRules}\n\nProduce a 30-day community engagement calendar.\nReturn ONE Markdown table with these columns and exactly 30 rows:\n\n| Day | Date Offset | Channel | Content Type | Topic | Copy Hook | CTA |\n\nVary channels (X, Telegram, Discord, LinkedIn, Reddit, Medium) and content types (AMA, meme, thread, partnership, dev update, governance). End with a 2-sentence summary below the table.`,
    };


    const { text } = await generateText({
      model,
      prompt: prompts[data.kind],
    });
    return { kind: data.kind, text };
  });
