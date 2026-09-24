import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { NoteModel } from "@/models/Note";
import { MAX_NOTE_DESCRIPTION_LENGTH } from "@/lib/note-constants";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeNote } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();

    const notes = await NoteModel.find({ owner: user.id }).sort({ date: -1, updatedAt: -1 }).lean();
    return NextResponse.json(notes.map((n) => serializeNote(n as never)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { title, date, description } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof description === "string" && description.length > MAX_NOTE_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${MAX_NOTE_DESCRIPTION_LENGTH.toLocaleString()} characters or fewer` },
        { status: 400 },
      );
    }

    await connectMongoose();
    const note = await NoteModel.create({
      owner: user.id,
      title: title.trim(),
      date: date ? new Date(date) : undefined,
      description: description || undefined,
    });

    return NextResponse.json(serializeNote(note.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
