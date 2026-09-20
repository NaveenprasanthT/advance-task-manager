import { fetchArticlesForInterest } from "./sources";
import { draftTaskFromArticle } from "./gemini";

export interface SuggestedTaskDraft {
  title: string;
  description: string;
  resourceUrl: string;
}

export async function generateSuggestionsForInterest(interest: string, limit = 3): Promise<SuggestedTaskDraft[]> {
  const articles = await fetchArticlesForInterest(interest, limit);

  const drafts = await Promise.allSettled(
    articles.map(async (article) => ({
      ...(await draftTaskFromArticle(article)),
      resourceUrl: article.link,
    })),
  );

  for (const result of drafts) {
    if (result.status === "rejected") {
      console.error(`draftTaskFromArticle failed for interest "${interest}":`, result.reason);
    }
  }

  return drafts
    .filter((result): result is PromiseFulfilledResult<SuggestedTaskDraft> => result.status === "fulfilled")
    .map((result) => result.value);
}
