export function GreenShieldLogo({ className = "h-11 w-11", showWordmark = false }) {
  return (
    <div className={`inline-flex items-center gap-3 ${showWordmark ? "" : className}`}>
      <svg
        aria-hidden="true"
        className={showWordmark ? "h-11 w-11" : "h-full w-full"}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 5 54 13v17c0 14.4-8.8 24.4-22 29C18.8 54.4 10 44.4 10 30V13l22-8Z"
          fill="url(#shieldFill)"
          stroke="rgba(190,255,213,.55)"
          strokeWidth="2"
        />
        <path
          d="M43.5 18.5H31.2c-7.8 0-13 5.1-13 12.5 0 7.7 5.3 12.8 13.4 12.8h6.7v-7.4h-7c-3.8 0-6.1-2.1-6.1-5.4 0-3.2 2.3-5.3 6.1-5.3h12.2v-7.2Z"
          fill="#07130f"
          fillOpacity=".9"
        />
        <path
          d="M20.5 48.5 43.8 18.6h-8.3L15.8 43.9c1.3 1.7 2.9 3.2 4.7 4.6Z"
          fill="#07130f"
          fillOpacity=".9"
        />
        <path
          d="M45.7 45.6V31.7H31.9l5.8 6h.6v4.8c2.8-.8 5.3-1.8 7.4-3.1Z"
          fill="#07130f"
          fillOpacity=".9"
        />
        <defs>
          <linearGradient id="shieldFill" x1="12" y1="10" x2="55" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7CFF4F" />
            <stop offset=".48" stopColor="#39F36A" />
            <stop offset="1" stopColor="#14D87B" />
          </linearGradient>
        </defs>
      </svg>
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
