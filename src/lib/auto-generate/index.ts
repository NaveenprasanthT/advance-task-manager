import { fetchArticlesForInterest } from "./sources";
import { draftTasksFromArticles } from "./gemini";

export interface SuggestedTaskDraft {
  title: string;
  description: string;
  resourceUrl: string;
}

export interface GenerateSuggestionsResult {
  drafts: SuggestedTaskDraft[];
  articleFetchAttempts: number;
  /** Set when the (batched) Gemini drafting call failed outright, after retries. */
  draftError?: string;
}

export async function generateSuggestionsForInterest(
  interest: string,
  limit = 3,
): Promise<GenerateSuggestionsResult> {
  const { articles, attempts: articleFetchAttempts } = await fetchArticlesForInterest(interest, limit);

  if (articles.length === 0) {
    return { drafts: [], articleFetchAttempts };
  }

  try {
    const drafted = await draftTasksFromArticles(articles);
    const drafts = drafted.map((draft, i) => ({ ...draft, resourceUrl: articles[i].link }));
    return { drafts, articleFetchAttempts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`draftTasksFromArticles failed for interest "${interest}":`, err);
    return { drafts: [], articleFetchAttempts, draftError: message };
  }
}
