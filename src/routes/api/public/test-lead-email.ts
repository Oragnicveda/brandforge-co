import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/test-lead-email")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) return new Response("RESEND_API_KEY missing", { status: 500 });

        const html = `
          <h2 style="font-family:Arial,sans-serif">Blockzia delivery test</h2>
          <p style="font-family:Arial,sans-serif">This is a test email confirming delivery and reply-to behavior.
          Replying to this email should go to <strong>test+lead@blockzia.marketing</strong>.</p>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: "Blockzia Leads <leads@blockzia.marketing>",
            to: ["blockziamarketing@gmail.com"],
            reply_to: "test+lead@blockzia.marketing",
            subject: "Blockzia test lead — delivery & reply-to check",
            html,
          }),
        });

        const text = await res.text();
        return new Response(JSON.stringify({ status: res.status, body: text }), {
          status: res.ok ? 200 : 500,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
