import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { PushSubscriptionModel } from "@/models/PushSubscription";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const endpoint = body?.endpoint;
    const keys = body?.keys;

    if (typeof endpoint !== "string" || !endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }
    if (typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
      return NextResponse.json({ error: "keys.p256dh and keys.auth are required" }, { status: 400 });
    }

    await connectMongoose();
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { owner: user.id, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const endpoint = body?.endpoint;

    if (typeof endpoint !== "string" || !endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }

    await connectMongoose();
    await PushSubscriptionModel.deleteOne({ endpoint, owner: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
