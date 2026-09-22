import { GoogleGenAI } from "@google/genai";
import { withRetry } from "@/lib/retry";
import { parseGeminiRetryDelayMs } from "@/lib/gemini-error";
import { geminiLimiter } from "@/lib/ai-rate-limiter";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

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
 * Turns a batch of real, already-fetched articles into short actionable
 * tasks - one Gemini call per interest instead of one per article, since the
 * free tier's per-minute quota is the tight constraint. The model only ever
 * sees title/snippet - it never sees or invents a URL; the real fetched link
 * is attached separately by the caller, matched back up by array position.
 */
export async function draftTasksFromArticles(
  articles: { title: string; snippet: string }[],
): Promise<DraftedTask[]> {
  if (articles.length === 0) return [];

  const response = await withRetry(
    async () => {
      await geminiLimiter.acquire();
      return getClient().models.generateContent({
        model: GEMINI_MODEL,
        contents:
          "Articles:\n" +
          articles
            .map((a, i) => `${i}. Title: ${a.title}\n   Snippet: ${a.snippet}`)
            .join("\n") +
          "\n\nFor EACH article above, turn it into a short, actionable personal task for someone " +
          "following this topic. Do not invent or include a URL - one will be attached separately. " +
          `Respond with only a JSON array of exactly ${articles.length} objects, in the same order as the ` +
          'articles, each shaped {"title": "<max 80 chars, action-oriented>", "description": "<1-2 sentences>"}',
        config: { responseMimeType: "application/json" },
      });
    },
    { attempts: 3, delayMs: 1000, getDelayMs: (err, _attempt, d) => parseGeminiRetryDelayMs(err) ?? d },
  );

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed = JSON.parse(text) as Partial<DraftedTask>[];
  if (!Array.isArray(parsed) || parsed.length !== articles.length) {
    throw new Error("Gemini response did not match the requested article count");
  }
  return parsed.map((draft, i) => {
    if (!draft.title || !draft.description) {
      throw new Error(`Gemini response missing title/description for article ${i}`);
    }
    return { title: draft.title, description: draft.description };
  });
}
