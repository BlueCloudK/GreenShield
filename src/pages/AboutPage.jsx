import { Cpu, Database, ShieldCheck, Workflow } from "lucide-react";

const focusAreas = [
  { title: "Model Security", icon: Cpu },
  { title: "RAG Security", icon: Database },
  { title: "Agent Security", icon: Workflow },
  { title: "Bảo mật ứng dụng AI", icon: ShieldCheck },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-8 sm:p-12">
        <p className="section-kicker">Giới thiệu</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-black text-white">GreenShield</h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
          GreenShield là quy trình kiểm thử bảo mật AI cho chatbot, hệ thống RAG, AI agent
          và API tích hợp AI. Nền tảng giúp đội ngũ scan, phát hiện, chấm điểm, báo cáo,
          sửa lỗi và retest các rủi ro bảo mật AI thực tế.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {focusAreas.map(({ title, icon: Icon }) => (
          <div className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 hover:border-cyan-300/30" key={title}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
              <Icon size={22} aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-black text-white">{title}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}
