import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { AccountMenu } from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Profile & Settings — Blockzia Labs" },
      { name: "description", content: "Manage your Blockzia Labs profile, company details and account password." },
      { property: "og:title", content: "Profile & Settings — Blockzia Labs" },
      { property: "og:description", content: "Manage your Blockzia Labs profile, company details and account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company, role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setCompany(profile.company ?? "");
        setRole(profile.role ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName || null, company: company || null, role: role || null });
      if (error) throw error;
      toast.success("Profile saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      } as Parameters<typeof supabase.auth.updateUser>[0]);
      if (error) throw error;
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-right" />
      <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2">
          <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile &amp; settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Your details are used to personalise everything the co-pilot writes for you.</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your details…
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
              <h2 className="font-medium">Your profile</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Founder" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Blockzia Labs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Founder / CMO" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} readOnly disabled />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
              </Button>
            </section>

            <section className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
              <h2 className="font-medium">Password</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cur">Current password</Label>
                  <Input id="cur" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <Button onClick={changePassword} disabled={changing} variant="outline" className="gap-2">
                {changing ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
              </Button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
