import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { MemoryModel } from "@/models/Memory";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeMemory } from "@/lib/serialize";
import { deleteMemoryFile } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string; fileId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, fileId } = await params;

    await connectMongoose();
    const memory = await MemoryModel.findOne({ _id: id, owner: user.id });
    if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

    const file = memory.files.id(fileId);
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    await deleteMemoryFile(file.publicId, file.resourceType).catch((err) =>
      console.error(`Failed to delete Cloudinary asset ${file.publicId}`, err),
    );
    file.deleteOne();
    await memory.save();

    return NextResponse.json(serializeMemory(memory.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
