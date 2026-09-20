import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export interface DraftedTask {
  title: string;
  description: string;
}

/**
 * Turns a real, already-fetched article into a short actionable task. The
 * model only ever sees the title/snippet - it never sees or invents a URL;
 * the real fetched link is attached separately by the caller.
 */
export async function draftTaskFromArticle(article: { title: string; snippet: string }): Promise<DraftedTask> {
  const response = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents:
      `Article title: ${article.title}\n` +
      `Snippet: ${article.snippet}\n\n` +
      "Turn this into a short, actionable personal task for someone following this topic. " +
      "Do not invent or include a URL - one will be attached separately. " +
      'Respond with only JSON in this exact shape: {"title": "<max 80 chars, action-oriented>", "description": "<1-2 sentences>"}',
    config: { responseMimeType: "application/json" },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed = JSON.parse(text) as Partial<DraftedTask>;
  if (!parsed.title || !parsed.description) {
    throw new Error("Gemini response missing title/description");
  }
  return { title: parsed.title, description: parsed.description };
}
