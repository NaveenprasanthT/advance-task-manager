import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";
import { MAX_NOTE_DESCRIPTION_LENGTH } from "@/lib/note-constants";

const noteSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date },
    // Sanitized HTML from the Tiptap rich-text editor.
    description: { type: String, maxlength: MAX_NOTE_DESCRIPTION_LENGTH },
  },
  { timestamps: true },
);

noteSchema.index({ owner: 1, date: 1 });
noteSchema.index({ owner: 1, updatedAt: -1 });

export type INote = InferSchemaType<typeof noteSchema> & { _id: Types.ObjectId };

export const NoteModel: Model<INote> = models.Note ?? model<INote>("Note", noteSchema);
