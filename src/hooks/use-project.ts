import { useEffect, useState } from "react";

export type Project = {
  name: string;
  mission: string;
  audience: string;
  token: string;
  brand: string;
};

const KEY = "ico-copilot-project";
const empty: Project = { name: "", mission: "", audience: "", token: "", brand: "" };

export function useProject() {
  const [project, setProject] = useState<Project>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProject({ ...empty, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  const save = (p: Project) => {
    setProject(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  };

  return { project, setProject: save, loaded, isReady: !!project.name && !!project.mission };
}
