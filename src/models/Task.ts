import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const TASK_CATEGORIES = ["Personal", "Professional"] as const;
export const TASK_STATUSES = ["Suggested", "Todo", "InProgress", "OnHold", "Done", "Aborted"] as const;
export const SUBTASK_STATUSES = ["Todo", "InProgress", "Done"] as const;
export const ESTIMATE_UNITS = ["hours", "points"] as const;
export const TASK_ORIGINS = ["manual", "auto", "recurring"] as const;
export const TASK_PRIORITIES = ["High", "Medium", "Low"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type SubtaskStatus = (typeof SUBTASK_STATUSES)[number];
export type EstimateUnit = (typeof ESTIMATE_UNITS)[number];
export type TaskOrigin = (typeof TASK_ORIGINS)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const subtaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: SUBTASK_STATUSES, default: "Todo" },
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: TASK_STATUSES, required: true },
    enteredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: TASK_CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 5000 },
    status: { type: String, enum: TASK_STATUSES, default: "Todo" },
    estimateValue: { type: Number, min: 0 },
    estimateUnit: { type: String, enum: ESTIMATE_UNITS, default: "hours" },
    dueDate: { type: Date },
    plannedStart: { type: Date },
    plannedEnd: { type: Date },
    actualCompletedAt: { type: Date },
    abortReason: {
      type: String,
      maxlength: 1000,
      validate: {
        validator: function (this: { status?: string }, value: string | undefined) {
          if (this.status === "Aborted") return Boolean(value && value.trim().length > 0);
          return true;
        },
        message: "abortReason is required when status is Aborted",
      },
    },
    statusHistory: { type: [statusHistorySchema], default: () => [{ status: "Todo", enteredAt: new Date() }] },
    subtasks: { type: [subtaskSchema], default: [] },
    boardOrder: { type: Number, default: 0 },
    resourceUrl: { type: String, trim: true, maxlength: 2000 },
    origin: { type: String, enum: TASK_ORIGINS, default: "manual" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    recurringTaskId: { type: Schema.Types.ObjectId, ref: "RecurringTask" },
    occurrenceDate: { type: Date },
  },
  { timestamps: true },
);

taskSchema.index({ owner: 1, category: 1, status: 1 });
taskSchema.index({ owner: 1, dueDate: 1 });
taskSchema.index({ owner: 1, status: 1, actualCompletedAt: 1 });
taskSchema.index({ owner: 1, boardOrder: 1 });
taskSchema.index({ recurringTaskId: 1, occurrenceDate: 1 });

export type ISubtask = InferSchemaType<typeof subtaskSchema> & { _id: Types.ObjectId };
export type IStatusHistoryEntry = InferSchemaType<typeof statusHistorySchema>;
export type ITask = InferSchemaType<typeof taskSchema> & {
  _id: Types.ObjectId;
  subtasks: ISubtask[];
};

export const TaskModel: Model<ITask> = models.Task ?? model<ITask>("Task", taskSchema);
