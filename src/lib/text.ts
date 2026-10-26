/** The first sentence of a text (up to the first . ! or ? followed by a space), or all of it. */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  return trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? trimmed;
}
