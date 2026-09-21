import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-flash-latest";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export interface GeneratedPuzzle {
  word: string;
  imageQueries: string[];
}

/**
 * Picks one concrete, guessable word for an interest, plus 4 Unsplash search
 * queries whose photos would each hint at part of it - a classic
 * "4 pics 1 word" design. The word is never spelled out in the queries.
 */
export async function generatePuzzleContent(interest: string): Promise<GeneratedPuzzle> {
  const response = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents:
      `Topic/interest: ${interest}\n\n` +
      "Pick ONE concrete, guessable English word (max 12 letters, a single word, no spaces or hyphens) " +
      "closely related to this topic - something a person could recognize from 4 photos, like a classic " +
      '"4 pics 1 word" puzzle. Then write 4 distinct Unsplash image search queries (2-4 words each) whose ' +
      "photos would each hint at part of the word or concept, without spelling the word out in the query text. " +
      'Respond with only JSON in this exact shape: {"word": "<UPPERCASE letters only>", ' +
      '"imageQueries": ["<query1>", "<query2>", "<query3>", "<query4>"]}',
    config: { responseMimeType: "application/json" },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed = JSON.parse(text) as Partial<GeneratedPuzzle>;
  if (!parsed.word || !parsed.imageQueries || parsed.imageQueries.length !== 4) {
    throw new Error("Gemini response missing word/imageQueries");
  }

  const word = parsed.word.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!word) throw new Error("Gemini returned an unusable word");

  return { word, imageQueries: parsed.imageQueries };
}
