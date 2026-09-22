import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";
import { TASK_CATEGORIES, TASK_PRIORITIES, ESTIMATE_UNITS } from "@/models/Task";

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

const recurringTaskSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: TASK_CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 5000 },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    estimateValue: { type: Number, min: 0 },
    estimateUnit: { type: String, enum: ESTIMATE_UNITS, default: "hours" },
    frequency: { type: String, enum: RECURRENCE_FREQUENCIES, required: true },
    // 0=Sun..6=Sat, weekly only.
    daysOfWeek: { type: [Number], default: undefined },
    // 1-31, monthly only.
    daysOfMonth: { type: [Number], default: undefined },
    active: { type: Boolean, default: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    // Cursor for the generation cron - mirrors User.autoGen.lastGeneratedAt.
    lastGeneratedDate: { type: Date },
  },
  { timestamps: true },
);

recurringTaskSchema.index({ owner: 1, active: 1 });

export type IRecurringTask = InferSchemaType<typeof recurringTaskSchema> & { _id: Types.ObjectId };

export const RecurringTaskModel: Model<IRecurringTask> =
  models.RecurringTask ?? model<IRecurringTask>("RecurringTask", recurringTaskSchema);
