const rows = [["Ứng dụng AI", "applications"], ["Bài kiểm thử tự động", "tests"], ["Thành viên", "members"]];

export function PricingComparison({ plans }) {
  return (
    <section className="min-w-0 border-t border-white/10 pt-6">
      <h2 className="text-xl font-bold text-white">So sánh hạn mức dự kiến</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead><tr className="border-b border-white/10 text-slate-400"><th className="p-3">Hạn mức</th>{plans.map((plan) => <th className="p-3 text-white" key={plan.id}>{plan.name}</th>)}</tr></thead>
          <tbody>{rows.map(([label, key]) => <tr className="border-b border-white/10" key={key}><th className="p-3 font-medium text-slate-300">{label}</th>{plans.map((plan) => <td className="p-3 text-slate-400" key={plan.id}>{plan[key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
