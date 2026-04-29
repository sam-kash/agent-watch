import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const Schema = z.object({
  email: z.string().email(),
  workspaceName: z.string().min(1).max(80),
  supabaseUserId: z.string().min(1),
});

// Called right after Supabase signup to provision the workspace
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { email, workspaceName, supabaseUserId } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data, error } = await supabase.auth.admin.getUserById(supabaseUserId);

  if (error || data.user?.email !== email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotent — if user already exists just return their workspace
  const existing = await db.user.findUnique({
    where: { email },
    include: { memberships: { include: { workspace: true } } },
  });

  if (existing?.memberships[0]) {
    return NextResponse.json({ workspace: existing.memberships[0].workspace });
  }

  // Generate a URL-safe slug from workspace name
  const slug = await uniqueSlug(workspaceName);

  const workspace = await db.workspace.create({
    data: {
      name: workspaceName,
      slug,
      plan: "FREE",
      members: {
        create: {
          role: "OWNER",
          user: {
            create: { email },
          },
        },
      },
    },
  });

  return NextResponse.json({ workspace }, { status: 201 });
}

async function uniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  let slug = base;
  let attempt = 0;

  while (await db.workspace.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }

  return slug;
}
