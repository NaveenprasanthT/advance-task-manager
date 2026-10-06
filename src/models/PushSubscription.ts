import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

// One row per browser/device a user has enabled push notifications on - a
// separate model (not embedded on User) since each subscription has its own
// lifecycle (created on opt-in, deleted on opt-out or once the push service
// reports it's gone), matching this codebase's convention of a dedicated
// model for anything with that shape (RecurringTaskLog, StudyPlanEntry)
// rather than an array on User.
const pushSubscriptionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ owner: 1 });

export type IPushSubscription = InferSchemaType<typeof pushSubscriptionSchema> & { _id: Types.ObjectId };

export const PushSubscriptionModel: Model<IPushSubscription> =
  models.PushSubscription ?? model<IPushSubscription>("PushSubscription", pushSubscriptionSchema);
