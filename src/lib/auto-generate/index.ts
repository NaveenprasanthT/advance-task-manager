import { fetchArticlesForInterest } from "./sources";
import { draftTaskFromArticle } from "./gemini";

export interface SuggestedTaskDraft {
  title: string;
  description: string;
  resourceUrl: string;
}

export interface GenerateSuggestionsResult {
  drafts: SuggestedTaskDraft[];
  articleFetchAttempts: number;
}

export async function generateSuggestionsForInterest(
  interest: string,
  limit = 3,
): Promise<GenerateSuggestionsResult> {
  const { articles, attempts: articleFetchAttempts } = await fetchArticlesForInterest(interest, limit);

  const results = await Promise.allSettled(
    articles.map(async (article) => ({
      ...(await draftTaskFromArticle(article)),
      resourceUrl: article.link,
    })),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(`draftTaskFromArticle failed for interest "${interest}":`, result.reason);
    }
  }

  const drafts = results
    .filter((result): result is PromiseFulfilledResult<SuggestedTaskDraft> => result.status === "fulfilled")
    .map((result) => result.value);

  return { drafts, articleFetchAttempts };
}
