import { createServerClient as createSupabaseRouteClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Validates the Supabase session from a route request and returns the
 * user's current workspace membership. SDK ingest keys are handled separately.
 */
export async function getAuthContext(req: NextRequest) {
  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (bearerToken && !bearerToken.startsWith("aw_")) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (error || !data.user?.email) return null;
    return getWorkspaceContext(data.user.email);
  }

  const supabase = createSupabaseRouteClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Middleware refreshes cookies for browser requests.
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  return getWorkspaceContext(data.user.email);
}

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthContext>>>;

export async function getServerAuthContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  return getWorkspaceContext(user.email);
}

async function getWorkspaceContext(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) return null;

  return {
    user,
    workspace: membership.workspace,
    role: membership.role,
  };
}
