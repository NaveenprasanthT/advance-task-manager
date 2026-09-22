import Parser from "rss-parser";
import { withRetry } from "@/lib/retry";

const parser = new Parser();

export interface FetchedArticle {
  title: string;
  link: string;
  snippet: string;
  publishedAt: string | null;
}

export interface FetchArticlesResult {
  articles: FetchedArticle[];
  attempts: number;
}

/**
 * Real articles for a free-text interest via Google News RSS search - works for
 * any topic (not just tech) and needs no API key. The returned `link` is the
 * only source of truth for a suggested task's URL; it is never LLM-generated.
 */
export async function fetchArticlesForInterest(interest: string, limit = 5): Promise<FetchArticlesResult> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(interest)}&hl=en-US&gl=US&ceid=US:en`;

  let attempts = 0;
  const feed = await withRetry(() => parser.parseURL(url), {
    attempts: 2,
    delayMs: 400,
    onAttempt: (n) => (attempts = n),
  });

  const articles = (feed.items ?? [])
    .filter((item) => item.title && item.link)
    .slice(0, limit)
    .map((item) => ({
      title: item.title!,
      link: item.link!,
      snippet: item.contentSnippet ?? item.content ?? "",
      publishedAt: item.isoDate ?? null,
    }));

  return { articles, attempts };
}
