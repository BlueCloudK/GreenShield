import { Link } from "react-router-dom";
import { RiskBadge } from "./RiskBadge";
import { ScanStatusBadge } from "./ScanStatusBadge";
import { getAppTypeLabel } from "../../utils/reportLabels";

export function ScanTable({ scans }) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/[0.04] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-bold">Tên ứng dụng</th>
              <th className="px-5 py-4 font-bold">Loại</th>
              <th className="px-5 py-4 font-bold">Điểm rủi ro</th>
              <th className="px-5 py-4 font-bold">Trạng thái</th>
              <th className="px-5 py-4 font-bold">Lần kiểm thử gần nhất</th>
              <th className="px-5 py-4 font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {scans.map((scan) => (
              <tr className="hover:bg-white/[0.03]" key={scan.id}>
                <td className="px-5 py-4 font-bold text-white">{scan.appName}</td>
                <td className="px-5 py-4 text-slate-300">{getAppTypeLabel(scan.appType)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white">{scan.riskScore}</span>
                    <RiskBadge level={scan.riskLevel} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ScanStatusBadge status={scan.status} />
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {new Date(scan.completedAt || scan.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-5 py-4">
                  <Link
                    className="focus-ring rounded-xl border border-white/10 px-3 py-2 font-semibold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                    to={`/reports/${scan.id}`}
                  >
                    Xem báo cáo
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
