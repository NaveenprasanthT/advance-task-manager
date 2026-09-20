import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const body = await req.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    await connectMongoose();
    const user = await UserModel.findById(sessionUser.id).select("+passwordHash");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.passwordHash) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    if (!user.authProviders?.includes("credentials")) {
      user.authProviders = [...(user.authProviders ?? []), "credentials"];
    }
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
