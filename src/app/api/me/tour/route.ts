import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function POST() {
  try {
    const user = await requireUser();
    await connectMongoose();
    await UserModel.findByIdAndUpdate(user.id, { hasSeenTour: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
