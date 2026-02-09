export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return JSON.stringify({ error: error.message });
  }
  return JSON.stringify({ error: String(error) });
}
