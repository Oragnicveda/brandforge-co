import { useEffect, useState } from "react";

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

const KEY = "ico-copilot-project";
const EVT = "ico-copilot-project-change";
const empty: Project = {
  fullName: "", workEmail: "", company: "", role: "",
  name: "", stage: "", chain: "", raiseSize: "",
  audience: "", mission: "", token: "", maxSupply: "", brand: "",
};

function read(): Project {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch { return empty; }
}

export function useProject() {
  const [project, setProject] = useState<Project>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProject(read());
    setLoaded(true);
    const sync = () => setProject(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = (p: Project) => {
    setProject(p);
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
      window.dispatchEvent(new Event(EVT));
    } catch {}
  };

  return { project, setProject: save, loaded, isReady: !!project.name && !!project.mission && !!project.workEmail };
}
