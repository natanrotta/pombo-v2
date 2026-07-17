/**
 * Strip honorifics ("Dr.", "Dra.", "Sr.", "Prof.", etc.) from the user's
 * stored full name and return the first real given name. Without this we
 * end up greeting `"Dr. Felipe Santos"` as "Bom dia, Dr." — funny once,
 * embarrassing on day two.
 */
const TITLE_PREFIXES = new Set([
  "dr",
  "dr.",
  "dra",
  "dra.",
  "sr",
  "sr.",
  "sra",
  "sra.",
  "prof",
  "prof.",
  "profa",
  "profa.",
]);

export function extractFirstName(fullName: string): string | null {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (!TITLE_PREFIXES.has(part.toLowerCase())) return part;
  }
  return null;
}
