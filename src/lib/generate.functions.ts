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
  return createLovableAiGatewayProvider(key)("google/gemini-3-flash-preview");
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
            allocations: z.array(z.object({ category: z.string(), percent: z.number(), vestingMonths: z.number() })).min(3).max(10),
            emissions: z.array(z.object({ month: z.number(), circulating: z.number() })).min(6).max(36),
            summary: z.string(),
          }),
        }),
        prompt: `${ctx}\n\nDesign a realistic tokenomics model. Output allocations (percentages summing ~100), a 24-month emission schedule (circulating supply in millions), and a short strategist summary.`,
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

    const prompts: Record<string, string> = {
      whitepaper: `${ctx}\n\nWrite a comprehensive ICO whitepaper in clean Markdown. Include: Abstract, Introduction, Problem, Solution, Technology, Tokenomics, Roadmap, Team placeholder, Legal disclaimer. Use proper headings and tables where useful. ~1500 words.`,
      social: `${ctx}\n\nGenerate on-brand launch content as Markdown with three clearly labeled sections:\n\n## X / Twitter Thread (8 tweets, numbered)\n## Telegram Announcement\n## Discord Community Post\n\nUse hooks, emojis sparingly, and CTAs.`,
      deck: `${ctx}\n\nGenerate a 10-slide investor pitch deck in Markdown. For each slide use:\n### Slide N: Title\n**Content:** bullet points\n**Image prompt:** detailed visual description for image generation`,
      emails: `${ctx}\n\nGenerate (1) a cold investor outreach email (subject + body), (2) a follow-up email, and (3) a target investor list of 8 plausible VC firms / angel archetypes with rationale. Markdown.`,
      calendar: `${ctx}\n\nGenerate a 30-day community engagement calendar as a Markdown table: Day | Channel | Content Type | Topic | CTA.`,
    };

    const { text } = await generateText({
      model,
      prompt: prompts[data.kind],
    });
    return { kind: data.kind, text };
  });
