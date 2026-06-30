import { AlertTriangle, CheckCircle2, FileClock, ScanLine } from "lucide-react";
import { ScanTable } from "../components/scan/ScanTable";
import { StatCard } from "../components/scan/StatCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { mockFindings, mockScans } from "../data/scans";

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
          title="AI security scans"
          description="Start scans, inspect risk scores, review evidence-backed findings, and track retests after fixes."
        />
        <Button className="w-fit" to="/scan/new">
          <ScanLine size={17} aria-hidden="true" />
          New Scan
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ScanLine} label="Total scans" value={totalScans} />
        <StatCard icon={AlertTriangle} label="High risk findings" tone="rose" value={highRiskFindings} />
        <StatCard icon={CheckCircle2} label="Last scan status" tone="cyan" value={lastScan?.status || "None"} />
        <StatCard icon={FileClock} label="Retests pending" tone="amber" value={retestsPending} />
      </div>

      <div className="mt-10">
        {mockScans.length === 0 ? (
          <EmptyState
            actionLabel="Start first scan"
            actionTo="/scan/new"
            description="Create your first AI security scan to generate a risk score, findings, evidence, and fix guidance."
            title="Start your first AI security scan"
          />
        ) : (
          <>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="section-kicker">Recent scans</p>
                <h2 className="mt-2 text-3xl font-black text-white">Latest AI app assessments</h2>
              </div>
              <Button to="/reports/scan-gs-001" variant="secondary">
                View demo report
              </Button>
            </div>
            <ScanTable scans={mockScans} />
          </>
        )}
      </div>
    </section>
  );
}
