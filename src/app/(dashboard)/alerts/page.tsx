import { db } from "@/lib/db";
import { AlertRulesList } from "@/components/alerts/AlertRulesList";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const METRIC_LABELS: Record<string, string> = {
  COST_USD: "Total cost (USD)",
  ERROR_RATE: "Session failure rate",
  TOKEN_COUNT: "Token count",
  LATENCY_P95: "P95 latency (ms)",
};

export default async function AlertsPage() {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const rules = await db.alertRule.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-5 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-t-primary">Alerts</h1>
          <p className="text-[11px] font-mono text-t-ghost">Get notified when your agents misbehave</p>
        </div>
      </div>

      <AlertRulesList rules={rules} metricLabels={METRIC_LABELS} />
    </div>
  );
}
