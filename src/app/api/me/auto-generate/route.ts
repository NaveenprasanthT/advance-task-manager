import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel, AUTO_GEN_FREQUENCIES, type AutoGenFrequency } from "@/models/User";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const CATEGORY_KEYS = ["personal", "professional"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

function serializeAutoGen(autoGen: {
  personal?: { enabled?: boolean; interests?: string[]; frequency?: string; lastGeneratedAt?: Date | null };
  professional?: { enabled?: boolean; interests?: string[]; frequency?: string; lastGeneratedAt?: Date | null };
}) {
  const shape = (settings?: {
    enabled?: boolean;
    interests?: string[];
    frequency?: string;
    lastGeneratedAt?: Date | null;
  }) => ({
    enabled: settings?.enabled ?? false,
    interests: settings?.interests ?? [],
    frequency: settings?.frequency ?? "weekly",
    lastGeneratedAt: settings?.lastGeneratedAt ? new Date(settings.lastGeneratedAt).toISOString() : null,
  });

  return {
    personal: shape(autoGen?.personal),
    professional: shape(autoGen?.professional),
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();

    const doc = await UserModel.findById(user.id).select("autoGen").lean();
    return NextResponse.json(serializeAutoGen(doc?.autoGen ?? {}));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const category = body?.category as CategoryKey;

    if (!CATEGORY_KEYS.includes(category)) {
      return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.enabled === "boolean") {
      update[`autoGen.${category}.enabled`] = body.enabled;
    }
    if (Array.isArray(body.interests)) {
      update[`autoGen.${category}.interests`] = body.interests
        .map((i: unknown) => String(i).trim())
        .filter(Boolean)
        .slice(0, 20);
    }
    if (body.frequency) {
      if (!AUTO_GEN_FREQUENCIES.includes(body.frequency as AutoGenFrequency)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
      }
      update[`autoGen.${category}.frequency`] = body.frequency;
    }

    await connectMongoose();
    const doc = await UserModel.findByIdAndUpdate(user.id, { $set: update }, { returnDocument: "after" })
      .select("autoGen")
      .lean();

    return NextResponse.json(serializeAutoGen(doc?.autoGen ?? {}));
  } catch (error) {
    return handleApiError(error);
  }
}
