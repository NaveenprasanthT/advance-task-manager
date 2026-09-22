import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { MemoryModel } from "@/models/Memory";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeMemory } from "@/lib/serialize";
import { deleteMemoryFile } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = ["name", "description", "rememberDate", "category", "priority"] as const;
const DATE_FIELDS = new Set(["rememberDate"]);

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const memory = await MemoryModel.findOne({ _id: id, owner: user.id }).lean();
    if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

    return NextResponse.json(serializeMemory(memory as never));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    await connectMongoose();
    const memory = await MemoryModel.findOne({ _id: id, owner: user.id });
    if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (DATE_FIELDS.has(field)) {
          (memory as never as Record<string, unknown>)[field] = value ? new Date(value) : undefined;
        } else {
          (memory as never as Record<string, unknown>)[field] =
            typeof value === "string" ? value.trim() || undefined : value;
        }
      }
    }

    await memory.save();
    return NextResponse.json(serializeMemory(memory.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const memory = await MemoryModel.findOne({ _id: id, owner: user.id });
    if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

    await Promise.all(
      memory.files.map((file) =>
        deleteMemoryFile(file.publicId, file.resourceType).catch((err) =>
          console.error(`Failed to delete Cloudinary asset ${file.publicId}`, err),
        ),
      ),
    );
    await memory.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
