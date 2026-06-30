export function SectionHeader({ kicker, title, description, align = "left", action }) {
  const centered = align === "center";

  return (
    <div
      className={`min-w-0 flex flex-col gap-5 ${
        centered ? "mx-auto max-w-3xl items-center text-center" : "max-w-3xl"
      }`}
    >
      <div className="min-w-0">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h2 className="mt-3 break-words text-3xl font-black leading-tight text-white sm:text-5xl">{title}</h2>
        {description ? <p className="mt-4 break-words text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
