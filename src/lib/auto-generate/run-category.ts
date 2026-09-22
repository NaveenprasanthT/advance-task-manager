import { TaskModel, type TaskCategory } from "@/models/Task";
import type { ICronLogInterestResult, CronLogEntryStatus } from "@/models/CronLog";
import { generateSuggestionsForInterest } from "@/lib/auto-generate";

const MAX_SUGGESTIONS_PER_INTEREST = 3;

export interface RunCategoryGenerationInput {
  ownerId: string;
  category: TaskCategory;
  interests: string[];
}

export interface RunCategoryGenerationResult {
  suggestionsCreated: number;
  interests: ICronLogInterestResult[];
  status: CronLogEntryStatus;
}

/**
 * Generates and persists suggested tasks for one user+category. Shared by
 * the scheduled cron route and the admin manual-retry endpoint so both run
 * identical logic - the only difference is who calls it and when.
 */
export async function runCategoryGeneration({
  ownerId,
  category,
  interests,
}: RunCategoryGenerationInput): Promise<RunCategoryGenerationResult> {
  const highestOrder = await TaskModel.findOne({ owner: ownerId, category, status: "Suggested" })
    .sort({ boardOrder: -1 })
    .select("boardOrder")
    .lean();
  let nextOrder = highestOrder ? (highestOrder.boardOrder ?? 0) + 1 : 0;

  const interestResults: ICronLogInterestResult[] = [];
  let suggestionsCreated = 0;
  let allSucceeded = true;

  for (const interest of interests) {
    try {
      const { drafts, articleFetchAttempts } = await generateSuggestionsForInterest(
        interest,
        MAX_SUGGESTIONS_PER_INTEREST,
      );
      for (const draft of drafts) {
        await TaskModel.create({
          owner: ownerId,
          category,
          title: draft.title,
          description: draft.description,
          resourceUrl: draft.resourceUrl,
          origin: "auto",
          status: "Suggested",
          statusHistory: [{ status: "Suggested", enteredAt: new Date() }],
          boardOrder: nextOrder++,
        });
        suggestionsCreated++;
      }
      interestResults.push({
        interest,
        succeeded: true,
        suggestionsCreated: drafts.length,
        attempts: articleFetchAttempts,
      });
    } catch (err) {
      allSucceeded = false;
      interestResults.push({
        interest,
        succeeded: false,
        suggestionsCreated: 0,
        attempts: 1,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // "skipped" (not "failure") when nothing errored but no articles/drafts
  // came back for any interest - there's genuinely nothing to report, as
  // opposed to something having gone wrong.
  const status: CronLogEntryStatus =
    suggestionsCreated > 0 ? (allSucceeded ? "success" : "partial") : allSucceeded ? "skipped" : "failure";

  return { suggestionsCreated, interests: interestResults, status };
}
