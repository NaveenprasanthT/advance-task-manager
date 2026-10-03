import type { StudyPlanEntryStatus } from "@/models/StudyPlanEntry";
import { toDateOnly } from "@/lib/recurrence";

export interface StreakEntryInput {
  status: StudyPlanEntryStatus;
  date: Date | string;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  expectedByToday: number;
  completedByToday: number;
}

/**
 * Shared by the study-plans list route (per-plan card stats) and the
 * aggregate analytics route (best streak across all plans), so the two
 * never disagree on what a "streak" or "on track" means.
 *
 * Only entries due by today (date <= today) count either way - a
 * not-yet-reached future entry shouldn't affect the streak or pace. The one
 * exception: an entry due exactly today that's still Pending doesn't break
 * the streak, since the day isn't over yet.
 */
export function computeStreakStats(entriesByIndexAsc: StreakEntryInput[], today: Date): StreakStats {
  const todayOnly = toDateOnly(today);
  let runningStreak = 0;
  let bestStreak = 0;
  let expectedByToday = 0;
  let completedByToday = 0;

  for (const entry of entriesByIndexAsc) {
    const entryDate = toDateOnly(new Date(entry.date));
    if (entryDate.getTime() > todayOnly.getTime()) continue;

    expectedByToday++;
    if (entry.status === "Completed") {
      completedByToday++;
      runningStreak++;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else if (entry.status === "Pending" && entryDate.getTime() === todayOnly.getTime()) {
      // Due exactly today and still unresolved - leave the streak as-is.
    } else {
      runningStreak = 0;
    }
  }

  return { currentStreak: runningStreak, bestStreak, expectedByToday, completedByToday };
}
