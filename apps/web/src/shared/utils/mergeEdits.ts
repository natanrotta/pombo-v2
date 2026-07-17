export function mergeEdits<T extends Record<string, unknown>>(
  entity: T,
  localEdits: Partial<T>
): T {
  const merged = { ...entity };
  for (const key of Object.keys(localEdits) as (keyof T)[]) {
    if (localEdits[key] !== undefined) {
      merged[key] = localEdits[key] as T[keyof T];
    }
  }
  return merged;
}
