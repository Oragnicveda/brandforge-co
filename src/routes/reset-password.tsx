import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hexagon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — Blockzia Labs" },
      { name: "description", content: "Choose a new password for your Blockzia Labs account." },
      { property: "og:title", content: "Reset password — Blockzia Labs" },
      { property: "og:description", content: "Choose a new password for your Blockzia Labs account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        toast.error("This reset link is invalid or has expired.");
        navigate({ to: "/auth" });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-12">
      <div className="panel w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: "var(--gradient-violet)" }}>
            <Hexagon className="h-5 w-5 text-background" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Blockzia Labs</h1>
            <p className="text-xs text-muted-foreground">Set a new password</p>
          </div>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
