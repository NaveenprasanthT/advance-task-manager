import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { MemoryModel } from "@/models/Memory";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeMemory } from "@/lib/serialize";
import { uploadMemoryFile } from "@/lib/cloudinary";
import { validateMemoryFile } from "@/lib/memory-files";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const formData = await req.formData();

    const incomingFiles = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (incomingFiles.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }
    for (const file of incomingFiles) {
      const error = validateMemoryFile(file);
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    await connectMongoose();
    const memory = await MemoryModel.findOne({ _id: id, owner: user.id });
    if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });

    const uploaded = await Promise.all(
      incomingFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadMemoryFile(buffer, file.name);
        return { ...result, fileName: file.name, fileType: file.type, fileSize: file.size };
      }),
    );
    memory.files.push(...uploaded);

    await memory.save();
    return NextResponse.json(serializeMemory(memory.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
