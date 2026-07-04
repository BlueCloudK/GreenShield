import logoMark from "../../assets/greenshield-logo-clean.png";

export function GreenShieldLogo({ className = "h-11 w-11", showWordmark = false }) {
  return (
    <div className={`inline-flex items-center gap-3 ${showWordmark ? "" : className}`}>
      <img
        alt=""
        aria-hidden="true"
        className={`${showWordmark ? "h-11 w-11" : "h-full w-full"} object-contain drop-shadow-[0_0_16px_rgba(67,255,94,0.22)]`}
        decoding="async"
        src={logoMark}
      />
      {showWordmark ? (
        <div className="leading-tight">
          <p className="text-lg font-black text-white">GreenShield</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/75">
            AI Security
          </p>
        </div>
      ) : null}
    </div>
  );
}
