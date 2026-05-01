import { db } from "@/lib/db";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { getServerAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const ctx = await getServerAuthContext();
  if (!ctx) redirect("/login");

  const keys = await db.apiKey.findMany({
    where: { workspaceId: ctx.workspace.id, revokedAt: null },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-lg font-semibold text-t-primary">Settings</h1>
      <ApiKeysPanel keys={keys} />
      <BillingPanel plan={ctx.workspace.plan} />
    </div>
  );
}
