/** The framework names in a profile: its "## " headings. Safe on client and server. */
export function frameworkNames(markdown: string): string[] {
  return [...String(markdown || "").matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim());
}

/** Count the top-level bullets in a Markdown list section. */
export function bulletCount(markdown: string): number {
  return (String(markdown || "").match(/^[-*]\s+/gm) ?? []).length;
}
