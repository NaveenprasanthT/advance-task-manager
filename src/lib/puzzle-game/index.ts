import { generatePuzzleContent } from "./gemini";
import { fetchUnsplashImage } from "./unsplash";

export interface BuiltPuzzle {
  word: string;
  imageUrls: string[];
}

export async function buildPuzzle(interests: string[]): Promise<BuiltPuzzle> {
  const interest = interests[Math.floor(Math.random() * interests.length)];
  const { word, imageQueries } = await generatePuzzleContent(interest);

  const imageUrls = await Promise.all(
    imageQueries.map(async (query) => (await fetchUnsplashImage(query)) ?? (await fetchUnsplashImage(word))),
  );

  if (imageUrls.some((url) => !url)) {
    throw new Error("Could not find enough images for this puzzle");
  }

  return { word, imageUrls: imageUrls as string[] };
}
