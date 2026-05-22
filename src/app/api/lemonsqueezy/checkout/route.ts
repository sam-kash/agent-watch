import { NextResponse } from "next/server";
import { getServerAuthContext } from "@/lib/auth";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req: Request) {
  if (!process.env.LEMON_SQUEEZY_API_KEY || !process.env.LEMON_SQUEEZY_STORE_ID) {
    return NextResponse.json({ error: "Lemon Squeezy is not configured" }, { status: 503 });
  }

  lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY });

  const ctx = await getServerAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { variantId } = await req.json();
  const workspace = ctx.workspace;

  try {
    const { data, error } = await createCheckout(
      process.env.LEMON_SQUEEZY_STORE_ID,
      variantId,
      {
        checkoutData: {
          custom: { workspaceId: workspace.id },
        },
      }
    );

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: data?.data.attributes.url });
  } catch (err: any) {
    console.error("Lemon Squeezy checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
