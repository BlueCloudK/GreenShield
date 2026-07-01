import { CheckCircle2, Minus } from "lucide-react";

const rows = [
  { label: "Số lượt kiểm thử", key: "scanQuota", type: "text" },
  { label: "Mức báo cáo", key: "reportLevel", type: "text" },
  { label: "Lượt kiểm thử lại", key: "retestCount", type: "text" },
  { label: "Đánh giá thủ công", key: "manualReview", type: "text" },
  {
    label: "Red team tiêm lệnh prompt",
    type: "feature",
    values: ["included", "included", "included", "included"],
  },
  {
    label: "Đánh giá rò rỉ RAG",
    type: "feature",
    values: ["preview", "included", "included", "included"],
  },
  {
    label: "Review lạm dụng agent/tool",
    type: "feature",
    values: ["none", "none", "included", "included"],
  },
  {
    label: "Xuất báo cáo có bằng chứng",
    type: "feature",
    values: ["none", "none", "included", "included"],
  },
  {
    label: "Xác minh sau khi sửa",
    type: "feature",
    values: ["none", "included", "included", "included"],
  },
];

function FeatureValue({ value }) {
  if (value === "none") {
    return (
      <span className="inline-flex items-center gap-2 text-slate-600">
        <Minus size={15} aria-hidden="true" />
        Không
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-slate-200">
      <CheckCircle2 className="text-emerald-300" size={15} aria-hidden="true" />
      {value === "preview" ? "Xem trước" : "Có"}
    </span>
  );
}

export function PricingComparison({ plans }) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-2xl font-black text-white">So sánh phạm vi dịch vụ</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Phân biệt rõ gói kiểm thử tự động, gói assessment có bằng chứng, kiểm thử lại và phần review thủ công.
        </p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-white/[0.035] text-slate-400">
            <tr>
              <th className="w-[260px] px-5 py-3 font-bold">Tính năng</th>
              {plans.map((plan) => (
                <th className="px-5 py-3 align-top" key={plan.name}>
                  <p className="font-black text-white">{plan.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {plan.price}
                    {plan.priceNote ? <span className="font-medium"> {plan.priceNote}</span> : null}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-white/10 hover:bg-white/[0.025]" key={row.label}>
                <td className="px-5 py-3 font-bold text-slate-300">{row.label}</td>
                {plans.map((plan) => (
                  <td className="px-5 py-3 text-slate-400" key={`${plan.name}-${row.label}`}>
                    {row.type === "feature" ? (
                      <FeatureValue value={row.values[plans.indexOf(plan)]} />
                    ) : (
                      plan[row.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
