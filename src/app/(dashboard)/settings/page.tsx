import { db } from "@/lib/db";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";
import { BillingPanel } from "@/components/settings/BillingPanel";

export default async function SettingsPage() {
  const WORKSPACE_ID = process.env.SEED_WORKSPACE_ID ?? "demo";

  const [workspace, keys] = await Promise.all([
    db.workspace.findUnique({ where: { id: WORKSPACE_ID } }),
    db.apiKey.findMany({
      where: { workspaceId: WORKSPACE_ID, revokedAt: null },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-lg font-semibold">Settings</h1>
      <ApiKeysPanel keys={keys} />
      <BillingPanel plan={workspace?.plan ?? "FREE"} />
    </div>
  );
}
