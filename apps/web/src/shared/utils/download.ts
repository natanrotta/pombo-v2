/**
 * Trigger a browser download of `data` serialized as a JSON file. Uses an
 * object URL + a synthetic anchor click, revoking the URL afterwards so the blob
 * is not leaked. Client-side only (no network).
 */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
