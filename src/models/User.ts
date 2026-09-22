import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const AUTO_GEN_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type AutoGenFrequency = (typeof AUTO_GEN_FREQUENCIES)[number];

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

const autoGenCategorySchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    interests: { type: [String], default: [] },
    frequency: { type: String, enum: AUTO_GEN_FREQUENCIES, default: "weekly" },
    lastGeneratedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    authProviders: {
      type: [String],
      enum: ["credentials", "google"],
      default: [],
    },
    themePreference: { type: String, enum: THEME_PREFERENCES, default: "system" },
    puzzleAccess: { type: Boolean, default: false },
    hasSeenTour: { type: Boolean, default: false },
    autoGen: {
      type: {
        personal: { type: autoGenCategorySchema, default: () => ({}) },
        professional: { type: autoGenCategorySchema, default: () => ({}) },
      },
      default: () => ({ personal: {}, professional: {} }),
      _id: false,
    },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const UserModel: Model<IUser> = models.User ?? model<IUser>("User", userSchema);
