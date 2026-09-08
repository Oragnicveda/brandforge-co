import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Hexagon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Blockzia Labs" },
      { name: "description", content: "Sign in with your Google account to access the Blockzia Labs AI co-pilot." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
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
            <p className="text-xs text-muted-foreground">Secure AI co-pilot for crypto launches</p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Welcome</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to start building your launch kit — new accounts get 4 free credits.
          </p>
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Continue with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          We only support Google sign-in. Your Gmail address becomes your account.
        </p>
      </div>
    </div>
  );
}
