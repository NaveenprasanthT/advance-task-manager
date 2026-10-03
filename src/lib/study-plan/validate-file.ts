// Own allow-list, separate from memory-files.ts's (image/PDF/spreadsheet
// oriented) - a study plan upload is always a plain-text or Word document.
export const MAX_STUDY_PLAN_FILE_BYTES = 2 * 1024 * 1024; // 2MB - plenty for a text curriculum

export const ALLOWED_STUDY_PLAN_MIME_TYPES = new Set([
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateStudyPlanFile(file: { name: string; size: number; type: string }): string | null {
  if (file.size > MAX_STUDY_PLAN_FILE_BYTES) return `"${file.name}" is larger than 2MB`;
  if (!ALLOWED_STUDY_PLAN_MIME_TYPES.has(file.type)) return `"${file.name}" must be a .txt or .docx file`;
  return null;
}
