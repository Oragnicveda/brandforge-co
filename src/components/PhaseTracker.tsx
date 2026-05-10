import { CheckCircle2, Circle } from "lucide-react";

const phases = [
  { key: "setup", label: "Setup", desc: "Brand & token context" },
  { key: "tokenomics", label: "Tokenomics", desc: "Model & simulate" },
  { key: "whitepaper", label: "Whitepaper", desc: "Draft & export" },
  { key: "marketing", label: "Marketing", desc: "Social + deck + emails" },
  { key: "launch", label: "Launch", desc: "Calendar & monitor" },
];

export function PhaseTracker({ done }: { done: Record<string, boolean> }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Launch phase</h3>
          <div className="text-xl font-semibold mt-0.5">Roadmap progress</div>
        </div>
        <span className="chip chip-primary">{Object.values(done).filter(Boolean).length}/{phases.length}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {phases.map((p, i) => {
          const ok = done[p.key];
          return (
            <div key={p.key} className="relative">
              <div className={`flex items-center gap-2 ${ok ? "text-primary" : "text-muted-foreground"}`}>
                {ok ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                <span className="text-xs uppercase tracking-wider">{p.label}</span>
              </div>
              <div className="text-xs text-muted-foreground/80 mt-1 truncate">{p.desc}</div>
              <div className={`mt-3 h-1 rounded-full ${ok ? "bg-primary" : "bg-secondary"}`} />
              {i < phases.length - 1 && <div className="hidden" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
