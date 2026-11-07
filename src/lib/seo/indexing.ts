type Environment = Readonly<Record<string, string | undefined>>;

export function isIndexable(env: Environment): boolean {
  return env.VERCEL_ENV === "production";
}
