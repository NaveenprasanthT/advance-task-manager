import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel, THEME_PREFERENCES } from "@/models/User";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const theme = body?.theme;

    if (!THEME_PREFERENCES.includes(theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }

    await connectMongoose();
    await UserModel.findByIdAndUpdate(user.id, { themePreference: theme });

    return NextResponse.json({ theme });
  } catch (error) {
    return handleApiError(error);
  }
}
