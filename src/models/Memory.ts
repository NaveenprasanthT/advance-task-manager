import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";
import { TASK_PRIORITIES } from "@/models/Task";

const memoryFileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String },
    fileSize: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const memorySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 5000 },
    rememberDate: { type: Date },
    category: { type: String, trim: true, maxlength: 60 },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    files: { type: [memoryFileSchema], default: [] },
  },
  { timestamps: true },
);

memorySchema.index({ owner: 1, rememberDate: 1 });
memorySchema.index({ owner: 1, createdAt: -1 });

export type IMemoryFile = InferSchemaType<typeof memoryFileSchema> & { _id: Types.ObjectId };
export type IMemory = InferSchemaType<typeof memorySchema> & {
  _id: Types.ObjectId;
  files: IMemoryFile[];
};

export const MemoryModel: Model<IMemory> = models.Memory ?? model<IMemory>("Memory", memorySchema);
