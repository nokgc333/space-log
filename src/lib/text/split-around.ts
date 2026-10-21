export function splitAround(
  text: string,
  needle: string,
): [before: string, after: string] | null {
  if (needle === "") return null;
  const index = text.indexOf(needle);
  if (index === -1) return null;
  return [text.slice(0, index), text.slice(index + needle.length)];
}
