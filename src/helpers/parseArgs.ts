export function parseArgs<T>(input: unknown): T {
  if (typeof input === "string") {
    input = JSON.parse(input);
  }
  // Azure Functions MCP extension passes the full request envelope;
  // tool arguments are nested under input.arguments
  if (input && typeof input === "object" && "arguments" in input) {
    return (input as { arguments: T }).arguments;
  }
  return (input ?? {}) as T;
}
