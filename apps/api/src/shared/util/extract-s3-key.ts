export function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Key is the pathname without the leading slash
    const key = parsed.pathname.slice(1);
    return key || null;
  } catch {
    return null;
  }
}
