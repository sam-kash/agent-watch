import { createServerClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Validates the Supabase JWT from the request cookie/header
 * and returns the user + their workspace membership.
 * Returns null if unauthenticated.
 */
export async function getAuthContext(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const token =
    req.cookies.get("sb-access-token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const user = await db.user.findUnique({
    where: { email: data.user.email! },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });

  if (!user || user.memberships.length === 0) return null;

  // For now return the first workspace — later we'll support workspace switching
  const membership = user.memberships[0];

  return {
    user,
    workspace: membership.workspace,
    role: membership.role,
  };
}

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthContext>>>;
