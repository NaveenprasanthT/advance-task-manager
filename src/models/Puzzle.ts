import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const puzzleSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    word: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    imageUrls: { type: [String], required: true },
    revealedIndices: { type: [Number], default: [] },
    solved: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

puzzleSchema.index({ owner: 1, createdAt: -1 });
// TTL: MongoDB auto-deletes the doc once expiresAt passes - no cron needed.
puzzleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IPuzzle = InferSchemaType<typeof puzzleSchema> & { _id: Types.ObjectId };

export const PuzzleModel: Model<IPuzzle> = models.Puzzle ?? model<IPuzzle>("Puzzle", puzzleSchema);
