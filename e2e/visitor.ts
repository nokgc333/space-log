const between = (low: number, high: number) =>
  Math.floor(Math.random() * (high - low + 1)) + low;

export function uniqueVisitorHeaders() {
  return {
    "x-forwarded-for": `10.${between(0, 255)}.${between(0, 255)}.${between(1, 254)}`,
  };
}
