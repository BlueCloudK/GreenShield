import { ShieldAlert } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="glass-panel rounded-3xl border-dashed p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
        <ShieldAlert aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">{description}</p>
      {actionLabel && actionTo ? (
        <Button className="mt-6" to={actionTo}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
