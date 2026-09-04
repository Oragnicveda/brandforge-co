import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setError(error?.message || "Authentication failed.");
        return;
      }
      if (data.user.email && !data.user.email_confirmed_at) {
        setError("Your email is not verified yet. Please open the link we emailed you.");
        return;
      }
      navigate({ to: "/app" });
    });
  }, [navigate]);


  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        {error ? (
          <div className="panel p-6 max-w-md">
            <h1 className="text-lg font-semibold text-destructive">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <a href="/auth" className="inline-block mt-4 text-primary hover:underline text-sm">Back to sign in</a>
          </div>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
