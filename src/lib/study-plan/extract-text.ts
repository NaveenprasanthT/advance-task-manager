import mammoth from "mammoth";

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extracts plain text from an uploaded study-plan document. Always returns
 * plain text regardless of container format, so parse-plan-document.ts only
 * ever has to understand one shape - a .docx is converted via mammoth's raw
 * text extraction, which ignores Word styles entirely (by design: the parser
 * matches literal marker words like "Day 1", not heading styles).
 */
export async function extractPlanText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === DOCX_MIME_TYPE) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf-8");
}
