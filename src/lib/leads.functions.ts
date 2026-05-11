import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LeadSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  workEmail: z.string().trim().email().max(200),
  company: z.string().trim().max(200).optional().default(""),
  role: z.string().trim().max(120).optional().default(""),
  name: z.string().trim().min(1).max(200),
  stage: z.string().trim().max(120).optional().default(""),
  chain: z.string().trim().max(120).optional().default(""),
  raiseSize: z.string().trim().max(120).optional().default(""),
  audience: z.string().trim().max(120).optional().default(""),
  token: z.string().trim().max(200).optional().default(""),
  maxSupply: z.string().trim().max(120).optional().default(""),
  mission: z.string().trim().min(1).max(4000),
  brand: z.string().trim().max(4000).optional().default(""),
});

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const rows: Array<[string, string]> = [
      ["Full name", data.fullName],
      ["Work email", data.workEmail],
      ["Company", data.company],
      ["Role", data.role],
      ["Project name", data.name],
      ["Launch stage", data.stage],
      ["Primary chain", data.chain],
      ["Target raise", data.raiseSize],
      ["Target audience", data.audience],
      ["Token symbol & utility", data.token],
      ["Max token supply", data.maxSupply],
      ["Mission", data.mission],
      ["Brand voice", data.brand],
    ];

    const html = `
      <h2 style="font-family:Arial,sans-serif">New Blockzia Labs lead</h2>
      <table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="border:1px solid #eee;background:#fafafa;font-weight:600;vertical-align:top">${escape(
                k,
              )}</td><td style="border:1px solid #eee;white-space:pre-wrap">${escape(
                v || "—",
              )}</td></tr>`,
          )
          .join("")}
      </table>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Blockzia Leads <onboarding@resend.dev>",
        to: ["blockziamarketing@gmail.com"],
        reply_to: data.workEmail,
        subject: `New lead: ${data.name} — ${data.fullName}`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error", res.status, text);
      throw new Error(`Email send failed (${res.status})`);
    }

    return { ok: true };
  });
