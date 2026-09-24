// Kept separate from models/Note.ts (which imports mongoose) so client
// components can use this value without pulling the Mongoose/MongoDB driver
// into the browser bundle.
// Vercel's serverless request-body cap is 4.5MB; 500K characters of raw HTML
// leaves large headroom even after JSON-escaping overhead, while still far
// exceeding any realistic note (itself roughly a 100,000-word document).
export const MAX_NOTE_DESCRIPTION_LENGTH = 500_000;
