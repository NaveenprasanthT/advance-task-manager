export interface ParsedTopic {
  title: string;
  description?: string;
}

export interface ParsedEntry {
  index: number; // 0-based
  label?: string;
  topics: ParsedTopic[];
}

export interface ParsePlanDocumentResult {
  entries: ParsedEntry[];
  warnings: string[];
  detectedUnit: "day" | "week" | "month" | null;
}

const BLOCK_START = /^(Day|Week|Month)\s+(\d+)\s*:?\s*(.*)$/i;
const TOPIC_LINE = /^Topic\s*:\s*(.+)$/i;
const DESCRIPTION_LINE = /^Description\s*:\s*(.+)$/i;

/**
 * Parses the documented plain-text study-plan format - see the "Import from
 * file" format guide in NewStudyPlanDialog. Operates on already-extracted
 * plain text (see extract-text.ts), so a .docx export parses identically to
 * a .txt file: this format is never dependent on Word's heading styles,
 * only on the literal marker words appearing as text.
 */
export function parsePlanDocument(rawText: string): ParsePlanDocumentResult {
  const lines = rawText.split(/\r?\n/);
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];
  const unitCounts: Record<string, number> = {};

  let current: ParsedEntry | null = null;
  let currentTopic: ParsedTopic | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const blockMatch = line.match(BLOCK_START);
    if (blockMatch) {
      const [, unitWord, indexStr, label] = blockMatch;
      const unitKey = unitWord.toLowerCase();
      unitCounts[unitKey] = (unitCounts[unitKey] ?? 0) + 1;

      current = {
        index: Number(indexStr) - 1,
        label: label.trim() || undefined,
        topics: [],
      };
      currentTopic = null;
      entries.push(current);
      continue;
    }

    const topicMatch = line.match(TOPIC_LINE);
    if (topicMatch) {
      if (!current) {
        warnings.push(`Found a "Topic:" line before any "Day/Week/Month N" marker - skipped: "${line}"`);
        continue;
      }
      currentTopic = { title: topicMatch[1].trim() };
      current.topics.push(currentTopic);
      continue;
    }

    const descriptionMatch = line.match(DESCRIPTION_LINE);
    if (descriptionMatch) {
      if (!currentTopic) {
        warnings.push(`Found a "Description:" line with no preceding "Topic:" - skipped: "${line}"`);
        continue;
      }
      if (currentTopic.description) {
        warnings.push(`Topic "${currentTopic.title}" has more than one "Description:" line - kept the first`);
        continue;
      }
      currentTopic.description = descriptionMatch[1].trim();
      continue;
    }

    warnings.push(`Unrecognized line skipped: "${line}"`);
  }

  for (const entry of entries) {
    if (entry.topics.length === 0) {
      warnings.push(`Day/Week/Month ${entry.index + 1} has no topics`);
    }
  }

  const unitEntries = Object.entries(unitCounts);
  let detectedUnit: ParsePlanDocumentResult["detectedUnit"] = null;
  if (unitEntries.length > 0) {
    unitEntries.sort((a, b) => b[1] - a[1]);
    detectedUnit = unitEntries[0][0] as ParsePlanDocumentResult["detectedUnit"];
    if (unitEntries.length > 1) {
      warnings.push(
        `Mixed markers found (${unitEntries.map(([u, c]) => `${u}: ${c}`).join(", ")}) - using "${detectedUnit}"`,
      );
    }
  }

  return { entries, warnings, detectedUnit };
}
