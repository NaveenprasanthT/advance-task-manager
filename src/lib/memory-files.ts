// Shared between the create (`/api/memories`) and add-files
// (`/api/memories/[id]/files`) routes, and mirrored client-side in
// NewMemoryDialog for an immediate error instead of a round trip.
export const MAX_MEMORY_FILE_BYTES = 4 * 1024 * 1024; // 4MB - see cloudinary.ts / plan for why

export const ALLOWED_MEMORY_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

export function validateMemoryFile(file: { name: string; size: number; type: string }): string | null {
  if (file.size > MAX_MEMORY_FILE_BYTES) return `"${file.name}" is larger than 4MB`;
  if (!ALLOWED_MEMORY_MIME_TYPES.has(file.type)) return `"${file.name}" is not an image, PDF, or Excel/CSV file`;
  return null;
}
