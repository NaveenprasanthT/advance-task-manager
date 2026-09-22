import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { MemoryModel, type IMemory } from "@/models/Memory";
import { TASK_PRIORITIES, type TaskPriority } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeMemory } from "@/lib/serialize";
import { uploadMemoryFile } from "@/lib/cloudinary";
import { validateMemoryFile } from "@/lib/memory-files";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const scope = searchParams.get("scope"); // "all" | "upcoming" | "past"
    const search = searchParams.get("search");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 100));

    const query: QueryFilter<IMemory> = { owner: user.id };
    if (category) query.category = category;
    if (priority && (TASK_PRIORITIES as readonly string[]).includes(priority)) {
      query.priority = priority as TaskPriority;
    }
    if (scope === "upcoming") query.rememberDate = { $gte: new Date() };
    else if (scope === "past") query.rememberDate = { $lt: new Date() };
    if (search) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: regex }, { description: regex }, { category: regex }];
    }

    const memories = await MemoryModel.find(query)
      .sort({ rememberDate: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(memories.map((m) => serializeMemory(m as IMemory)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();

    const name = formData.get("name");
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const description = formData.get("description");
    const rememberDate = formData.get("rememberDate");
    const category = formData.get("category");
    const priority = formData.get("priority");
    if (priority && !(TASK_PRIORITIES as readonly string[]).includes(String(priority))) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const incomingFiles = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of incomingFiles) {
      const error = validateMemoryFile(file);
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    await connectMongoose();

    const uploaded = await Promise.all(
      incomingFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadMemoryFile(buffer, file.name);
        return { ...result, fileName: file.name, fileType: file.type, fileSize: file.size };
      }),
    );

    const memory = await MemoryModel.create({
      owner: user.id,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || undefined : undefined,
      rememberDate: typeof rememberDate === "string" && rememberDate ? new Date(rememberDate) : undefined,
      category: typeof category === "string" ? category.trim() || undefined : undefined,
      priority: (priority as TaskPriority) || "Medium",
    });
    if (uploaded.length > 0) {
      memory.files.push(...uploaded);
      await memory.save();
    }

    return NextResponse.json(serializeMemory(memory.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
