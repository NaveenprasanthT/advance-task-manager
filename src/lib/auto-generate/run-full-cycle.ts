import { UserModel, type AutoGenFrequency } from "@/models/User";
import { type TaskCategory } from "@/models/Task";
import { type ICronLogEntry } from "@/models/CronLog";
import { runCategoryGeneration } from "@/lib/auto-generate/run-category";

// Concurrency lock shared by the scheduled cron route and the admin manual
// "Run now" endpoint - both target the same fixed lock id so a manual run
// can never overlap a scheduled one (or another manual one).
export const LOCK_ID = "generate-todos";
export const LOCK_TTL_MS = 120_000; // safety valve past maxDuration, in case release itself fails

const CATEGORY_MAP: Record<"personal" | "professional", TaskCategory> = {
  personal: "Personal",
  professional: "Professional",
};

function isDue(frequency: AutoGenFrequency, lastGeneratedAt: Date | null | undefined): boolean {
  if (!lastGeneratedAt) return true;
  const days = { daily: 1, weekly: 7, monthly: 30 }[frequency];
  return Date.now() - new Date(lastGeneratedAt).getTime() >= days * 24 * 60 * 60 * 1000;
}

export interface RunFullGenerationCycleResult {
  usersConsidered: number;
  entries: ICronLogEntry[];
  hadRouteError: boolean;
}

/**
 * Loops every user with auto-generate enabled and runs due categories
 * through `runCategoryGeneration`. Shared by the scheduled cron route and
 * the admin manual "Run now" endpoint so both run identical logic - the
 * only difference is who calls it and when, and how the run gets logged.
 */
export async function runFullGenerationCycle(): Promise<RunFullGenerationCycleResult> {
  const entries: ICronLogEntry[] = [];
  let usersConsidered = 0;
  let hadRouteError = false;

  try {
    const users = await UserModel.find({
      $or: [{ "autoGen.personal.enabled": true }, { "autoGen.professional.enabled": true }],
    });
    usersConsidered = users.length;

    for (const user of users) {
      const ownerId = user._id.toString();
      let changed = false;

      for (const key of Object.keys(CATEGORY_MAP) as (keyof typeof CATEGORY_MAP)[]) {
        const settings = user.autoGen?.[key];
        const category = CATEGORY_MAP[key];
        if (!settings?.enabled || !settings.interests.length) continue;
        if (!isDue(settings.frequency as AutoGenFrequency, settings.lastGeneratedAt)) continue;

        const entryStart = Date.now();
        const result = await runCategoryGeneration({ ownerId, category, interests: settings.interests });
        const advanced = result.suggestionsCreated > 0;

        // Only advance lastGeneratedAt when the user actually got value this
        // run - a total failure (or a run that found nothing) should be
        // retried on the very next tick instead of waiting a full frequency
        // window (up to 30 days for "monthly").
        if (advanced) {
          settings.lastGeneratedAt = new Date();
          changed = true;
        }

        entries.push({
          type: "user_category",
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name,
          category,
          status: result.status,
          interests: result.interests,
          suggestionsCreated: result.suggestionsCreated,
          lastGeneratedAtAdvanced: advanced,
          durationMs: Date.now() - entryStart,
        });
      }

      if (changed) await user.save();
    }
  } catch (err) {
    hadRouteError = true;
    entries.push({
      type: "route_error",
      status: "failure",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    console.error("generate-todos full cycle error", err);
  }

  return { usersConsidered, entries, hadRouteError };
}

export function deriveRunStatus(entries: ICronLogEntry[]): "success" | "partial" | "failure" {
  if (entries.length === 0) return "success";
  const allOk = entries.every((e) => e.status === "success" || e.status === "skipped");
  if (allOk) return "success";
  const allFailed = entries.every((e) => e.status === "failure");
  return allFailed ? "failure" : "partial";
}
