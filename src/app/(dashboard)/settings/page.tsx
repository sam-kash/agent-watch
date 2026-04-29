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
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-lg font-semibold">Settings</h1>
      <ApiKeysPanel keys={keys} />
      <BillingPanel plan={ctx.workspace.plan} />
    </div>
  );
}
