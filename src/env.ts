export function env(name: string, fallback?: string): string | undefined {
  return Bun.env[name] ?? fallback;
}

export function envBool(name: string, fallback = false): boolean {
  const value = Bun.env[name];
  if (value === undefined) return fallback;
  return value !== "false" && value !== "0";
}
