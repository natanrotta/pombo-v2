export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
