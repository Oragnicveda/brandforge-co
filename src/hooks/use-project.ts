import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Project = {
  fullName: string;
  workEmail: string;
  company: string;
  role: string;
  name: string;
  stage: string;
  chain: string;
  raiseSize: string;
  audience: string;
  mission: string;
  token: string;
  maxSupply: string;
  brand: string;
};

const empty: Project = {
  fullName: "", workEmail: "", company: "", role: "",
  name: "", stage: "", chain: "", raiseSize: "",
  audience: "", mission: "", token: "", maxSupply: "", brand: "",
};

const EVT = "ico-copilot-project-change";

type Row = {
  id: string;
  full_name: string | null;
  work_email: string | null;
  company: string | null;
  role: string | null;
  name: string;
  stage: string | null;
  chain: string | null;
  raise_size: string | null;
  audience: string | null;
  mission: string;
  token: string | null;
  max_supply: string | null;
  brand: string | null;
};

function rowToProject(r: Row): Project {
  return {
    fullName: r.full_name ?? "",
    workEmail: r.work_email ?? "",
    company: r.company ?? "",
    role: r.role ?? "",
    name: r.name,
    stage: r.stage ?? "",
    chain: r.chain ?? "",
    raiseSize: r.raise_size ?? "",
    audience: r.audience ?? "",
    mission: r.mission,
    token: r.token ?? "",
    maxSupply: r.max_supply ?? "",
    brand: r.brand ?? "",
  };
}

function projectToRow(p: Project) {
  return {
    full_name: p.fullName || null,
    work_email: p.workEmail || null,
    company: p.company || null,
    role: p.role || null,
    name: p.name,
    stage: p.stage || null,
    chain: p.chain || null,
    raise_size: p.raiseSize || null,
    audience: p.audience || null,
    mission: p.mission,
    token: p.token || null,
    max_supply: p.maxSupply || null,
    brand: p.brand || null,
  };
}

export function useProject() {
  const [project, setProjectState] = useState<Project>(empty);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setProjectState(empty);
      setProjectId(null);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .select("id, full_name, work_email, company, role, name, stage, chain, raise_size, audience, mission, token, max_supply, brand")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("load project", error);
    if (data) {
      setProjectState(rowToProject(data as Row));
      setProjectId((data as Row).id);
    } else {
      setProjectState(empty);
      setProjectId(null);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const sync = () => load();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, [load]);

  const save = useCallback(async (p: Project) => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw new Error("Not signed in");
    if (!p.name || !p.mission) throw new Error("Project name and mission required");

    const row = projectToRow(p);
    if (projectId) {
      const { error } = await supabase.from("projects").update(row).eq("id", projectId);
      if (error) throw error;
      setProjectState(p);
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...row, user_id: uid })
        .select("id")
        .single();
      if (error) throw error;
      setProjectId(data.id);
      setProjectState(p);
    }
    window.dispatchEvent(new Event(EVT));
  }, [projectId]);

  return {
    project,
    setProject: save,
    loaded,
    projectId,
    isReady: !!project.name && !!project.mission && !!project.workEmail,
  };
}
