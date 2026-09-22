import { generatePuzzleContent } from "./gemini";
import { fetchUnsplashImage } from "./unsplash";
import type { AiRequestStage } from "@/models/AiRequestLog";

export interface BuiltPuzzle {
  word: string;
  imageUrls: string[];
}

// Tags which stage failed so the caller can log it without pattern-matching
// error text.
export class PuzzleGenerationError extends Error {
  constructor(
    message: string,
    public stage: AiRequestStage,
  ) {
    super(message);
    this.name = "PuzzleGenerationError";
  }
}

export async function buildPuzzle(interests: string[]): Promise<BuiltPuzzle> {
  const interest = interests[Math.floor(Math.random() * interests.length)];

  let word: string;
  let imageQueries: string[];
  try {
    ({ word, imageQueries } = await generatePuzzleContent(interest));
  } catch (err) {
    throw new PuzzleGenerationError(err instanceof Error ? err.message : String(err), "gemini");
  }

  let imageUrls: (string | null)[];
  try {
    imageUrls = await Promise.all(
      imageQueries.map(async (query) => (await fetchUnsplashImage(query)) ?? (await fetchUnsplashImage(word))),
    );
  } catch (err) {
    throw new PuzzleGenerationError(err instanceof Error ? err.message : String(err), "unsplash");
  }

  if (imageUrls.some((url) => !url)) {
    throw new PuzzleGenerationError("Could not find enough images for this puzzle", "unsplash");
  }

  return { word, imageUrls: imageUrls as string[] };
}
