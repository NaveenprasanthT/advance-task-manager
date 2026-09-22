import { withRetry } from "@/lib/retry";

const UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos";

interface UnsplashSearchResponse {
  results?: { urls?: { regular?: string; small?: string } }[];
}

export async function fetchUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY environment variable is not set");

  const url = `${UNSPLASH_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
  const data = await withRetry(
    async () => {
      const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
      if (!res.ok) throw new Error(`Unsplash search failed: ${res.status}`);
      return (await res.json()) as UnsplashSearchResponse;
    },
    { attempts: 2, delayMs: 400 },
  );

  const photo = data.results?.[0];
  return photo?.urls?.regular ?? photo?.urls?.small ?? null;
}
