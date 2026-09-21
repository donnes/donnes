export type Usage = { model: string; input: number | null; output: number | null; generatedAt: string };
export function usage(model: unknown, input: unknown, output: unknown, now: number): Usage {
  const tokens = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
  return { model: typeof model === "string" ? model.slice(0, 100) : "unknown", input: tokens(input), output: tokens(output), generatedAt: new Date(now).toISOString() };
}
