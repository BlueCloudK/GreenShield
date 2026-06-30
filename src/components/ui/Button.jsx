import { Link } from "react-router-dom";

const variants = {
  primary:
    "bg-emerald-300 text-slate-950 hover:bg-emerald-200 active:translate-y-px",
  secondary:
    "border border-white/10 bg-slate-950/40 text-slate-100 hover:border-emerald-300/40 hover:bg-slate-900/70 active:translate-y-px",
  dark: "bg-slate-100 text-slate-950 hover:bg-white",
  ghost: "bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white active:translate-y-px",
  danger: "bg-rose-500/12 text-rose-200 hover:bg-rose-500/20",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  to,
  type = "button",
  ...props
}) {
  const classes = `focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
