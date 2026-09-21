import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (typeof body.puzzleAccess !== "boolean") {
      return NextResponse.json({ error: "puzzleAccess must be a boolean" }, { status: 400 });
    }

    await connectMongoose();
    const user = await UserModel.findByIdAndUpdate(
      id,
      { puzzleAccess: body.puzzleAccess },
      { returnDocument: "after" },
    ).select("puzzleAccess");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ id, puzzleAccess: user.puzzleAccess });
  } catch (error) {
    return handleApiError(error);
  }
}
