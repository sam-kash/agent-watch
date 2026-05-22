import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const hmac = crypto.createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
    const digest = Buffer.from(hmac.update(text).digest("hex"), "utf8");
    const signature = Buffer.from(req.headers.get("x-signature") || "", "utf8");

    if (!crypto.timingSafeEqual(digest, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(text);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const workspaceId = customData?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace ID provided" }, { status: 400 });
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const variantId = payload.data.attributes.variant_id.toString();
      
      let plan: "FREE" | "TEAM" | "SCALE" = "FREE";
      if (variantId === process.env.NEXT_PUBLIC_LS_VARIANT_TEAM) plan = "TEAM";
      if (variantId === process.env.NEXT_PUBLIC_LS_VARIANT_SCALE) plan = "SCALE";

      await db.workspace.update({
        where: { id: workspaceId },
        data: { plan, stripeSubscriptionId: payload.data.id.toString() }, // Re-using this DB field for simplicity
      });
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      await db.workspace.update({
        where: { id: workspaceId },
        data: { plan: "FREE", stripeSubscriptionId: null },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
