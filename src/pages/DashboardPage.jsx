import { AlertTriangle, CheckCircle2, FileClock, ScanLine } from "lucide-react";
import { ScanTable } from "../components/scan/ScanTable";
import { StatCard } from "../components/scan/StatCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { mockFindings, mockScans } from "../data/scans";
import { getScanStatusLabel } from "../utils/reportLabels";

export default function DashboardPage() {
  const totalScans = mockScans.length;
  const highRiskFindings = mockFindings.filter((finding) =>
    ["High", "Critical"].includes(finding.severity),
  ).length;
  const lastScan = mockScans[0];
  const retestsPending = mockFindings.filter((finding) =>
    ["Pending fix", "Ready", "Not retested"].includes(finding.retestStatus),
  ).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <SectionHeader
          kicker="Dashboard"
          title="Trung tâm scan bảo mật AI"
          description="Tạo phiên scan, xem điểm rủi ro, đọc bằng chứng tấn công và theo dõi retest sau khi sửa."
        />
        <Button className="w-fit" to="/scan/new">
          <ScanLine size={17} aria-hidden="true" />
          Tạo scan mới
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ScanLine} label="Tổng phiên scan" value={totalScans} />
        <StatCard icon={AlertTriangle} label="Phát hiện rủi ro cao" tone="rose" value={highRiskFindings} />
        <StatCard icon={CheckCircle2} label="Trạng thái mới nhất" tone="cyan" value={lastScan ? getScanStatusLabel(lastScan.status) : "Chưa có"} />
        <StatCard icon={FileClock} label="Đang chờ retest" tone="amber" value={retestsPending} />
      </div>

      <div className="mt-10">
        {mockScans.length === 0 ? (
          <EmptyState
            actionLabel="Tạo scan đầu tiên"
            actionTo="/scan/new"
            description="Tạo phiên scan đầu tiên để có điểm rủi ro, phát hiện, bằng chứng và hướng sửa."
            title="Bắt đầu scan bảo mật AI đầu tiên"
          />
        ) : (
          <>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="section-kicker">Phiên gần đây</p>
                <h2 className="mt-2 text-3xl font-black text-white">Phiên scan gần đây</h2>
              </div>
              <Button to="/reports/scan-gs-001" variant="secondary">
                Xem báo cáo mẫu
              </Button>
            </div>
            <ScanTable scans={mockScans} />
          </>
        )}
      </div>
    </section>
  );
}
