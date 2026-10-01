import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const RECURRING_LOG_STATUSES = ["done", "missed"] as const;
export type RecurringLogStatus = (typeof RECURRING_LOG_STATUSES)[number];

// One row per resolved due day - there is no row for an unresolved (today or
// future) due day. "Due, no row" at read time means "not yet resolved";
// due-ness itself always comes from isDueOn() against the RecurringTask
// template, never duplicated here.
const recurringTaskLogSchema = new Schema(
  {
    recurringTaskId: { type: Schema.Types.ObjectId, ref: "RecurringTask", required: true },
    // Denormalized like Task.owner - every read path filters by owner, and
    // the writer always already has the owning (ownership-checked) template
    // loaded, so this costs nothing and avoids a join on every query.
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Midnight UTC via toDateOnly() - the calendar day this row resolves.
    date: { type: Date, required: true },
    status: { type: String, enum: RECURRING_LOG_STATUSES, required: true },
    resolvedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

// One row per template per day - also the toggle endpoint's upsert key.
recurringTaskLogSchema.index({ recurringTaskId: 1, date: 1 }, { unique: true });
// Heatmap/analytics window query path.
recurringTaskLogSchema.index({ owner: 1, date: 1 });

export type IRecurringTaskLog = InferSchemaType<typeof recurringTaskLogSchema> & { _id: Types.ObjectId };

export const RecurringTaskLogModel: Model<IRecurringTaskLog> =
  models.RecurringTaskLog ?? model<IRecurringTaskLog>("RecurringTaskLog", recurringTaskLogSchema);
