import Parser from "rss-parser";

const parser = new Parser();

export interface FetchedArticle {
  title: string;
  link: string;
  snippet: string;
  publishedAt: string | null;
}

/**
 * Real articles for a free-text interest via Google News RSS search - works for
 * any topic (not just tech) and needs no API key. The returned `link` is the
 * only source of truth for a suggested task's URL; it is never LLM-generated.
 */
export async function fetchArticlesForInterest(interest: string, limit = 5): Promise<FetchedArticle[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(interest)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(url);

  return (feed.items ?? [])
    .filter((item) => item.title && item.link)
    .slice(0, limit)
    .map((item) => ({
      title: item.title!,
      link: item.link!,
      snippet: item.contentSnippet ?? item.content ?? "",
      publishedAt: item.isoDate ?? null,
    }));
}
