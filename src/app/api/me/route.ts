import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    await connectMongoose();
    await UserModel.findByIdAndUpdate(user.id, { name });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    return handleApiError(error);
  }
}
