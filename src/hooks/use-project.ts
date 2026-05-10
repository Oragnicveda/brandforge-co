import { useEffect, useState } from "react";

export type Project = {
  // Lead contact
  fullName: string;
  workEmail: string;
  company: string;
  role: string;
  // Project context
  name: string;
  stage: string;
  chain: string;
  raiseSize: string;
  audience: string;
  mission: string;
  token: string;
  brand: string;
};

const KEY = "ico-copilot-project";
const empty: Project = {
  fullName: "", workEmail: "", company: "", role: "",
  name: "", stage: "", chain: "", raiseSize: "",
  audience: "", mission: "", token: "", brand: "",
};

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

  return { project, setProject: save, loaded, isReady: !!project.name && !!project.mission && !!project.workEmail };
}
