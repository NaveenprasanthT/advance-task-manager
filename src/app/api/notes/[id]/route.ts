import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { NoteModel } from "@/models/Note";
import { MAX_NOTE_DESCRIPTION_LENGTH } from "@/lib/note-constants";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeNote } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = ["title", "date", "description"] as const;
const DATE_FIELDS = new Set(["date"]);

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const note = await NoteModel.findOne({ _id: id, owner: user.id }).lean();
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    return NextResponse.json(serializeNote(note as never));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    if (
      "description" in body &&
      typeof body.description === "string" &&
      body.description.length > MAX_NOTE_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        { error: `Description must be ${MAX_NOTE_DESCRIPTION_LENGTH.toLocaleString()} characters or fewer` },
        { status: 400 },
      );
    }

    await connectMongoose();
    const note = await NoteModel.findOne({ _id: id, owner: user.id });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (DATE_FIELDS.has(field)) {
          (note as never as Record<string, unknown>)[field] = value ? new Date(value) : undefined;
        } else {
          (note as never as Record<string, unknown>)[field] =
            typeof value === "string" ? value.trim() || undefined : value;
        }
      }
    }

    await note.save();
    return NextResponse.json(serializeNote(note.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const result = await NoteModel.deleteOne({ _id: id, owner: user.id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
