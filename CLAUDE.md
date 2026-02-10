# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm run build          # Compile TypeScript (tsc)
npm run clean          # Remove dist/
npm start              # Clean + build + func start (runs prestart hook)
npm run watch          # TypeScript watch mode (for development alongside func start)
```

No test or lint commands are configured.

Local dev requires Azure Functions Core Tools (`func`), Azurite (`azurite --silent` in a separate terminal), and a valid `ATERA_API_KEY` in `local.settings.json`.

MCP endpoint: `http://localhost:7071/runtime/webhooks/mcp` (Streamable HTTP — POST only, GET returns 405)

Deploy: `azd up` (uses `azure.yaml` and `infra/` Bicep templates). For redeployment without infra changes: `azd deploy`.

## Architecture

This is an MCP (Model Context Protocol) server hosted on Azure Functions v4 (Node.js 20, TypeScript). It exposes 11 read-only tools that wrap the Atera RMM REST API, allowing AI agents to query Atera data.

### Request Flow

```
MCP Client → Azure Functions MCP endpoint → app.mcpTool() handler → parseArgs (unwrap envelope) → ateraClient → Atera API v3
```

Each tool handler in `src/functions/` calls the shared HTTP client (`src/clients/ateraClient.ts`), which adds the `X-API-KEY` header and calls the Atera API using native `fetch`. Handlers return plain JSON strings — the Azure Functions MCP framework automatically wraps them in `{ content: [{ type: "text", text: "..." }] }`.

### Key Modules

- **`src/clients/ateraClient.ts`** — Two functions: `ateraGet<T>(path, params)` for single-entity endpoints, `ateraGetPaginated<T>(path, params)` for list endpoints. Both read `ATERA_API_KEY` from env.
- **`src/types/atera.ts`** — TypeScript interfaces matching Atera's PascalCase JSON responses.
- **`src/functions/`** — Tool registrations grouped by Atera domain: `account.ts` (1 tool), `customers.ts` (2), `contracts.ts` (3), `tickets.ts` (5).
- **`src/helpers/`** — `parseArgs.ts` (unwraps MCP request envelope to extract tool arguments), `errorHandler.ts` (formats caught errors as JSON), `responseFormatter.ts` (JSON serialization + paginated result wrapper).

### MCP Tool Registration Pattern

Tools use `app.mcpTool()` with the `toolProperties` field (NOT `inputSchema`) and the fluent `arg` builder. Handlers receive the raw MCP request envelope as `input: unknown` and must use `parseArgs()` to extract actual tool arguments:

```typescript
import { app, arg } from "@azure/functions";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("tool_name", {
  toolName: "tool_name",
  description: "...",
  toolProperties: {
    requiredParam: arg.number().describe("..."),
    optionalParam: arg.string().describe("...").optional(),
  },
  handler: async (input: unknown) => {
    const { requiredParam, optionalParam } = parseArgs<{
      requiredParam: number;
      optionalParam?: string;
    }>(input);
    try {
      const result = await ateraGet<SomeType>(`/path/${requiredParam}`);
      return toJson(result);
    } catch (error) {
      return formatError(error);
    }
  },
});
```

### Gotchas

- **MCP envelope unwrapping**: The Azure Functions MCP extension passes the full request envelope `{ name, arguments, sessionid, transport }` to the handler — not just the tool arguments. `parseArgs()` handles this by checking for and unwrapping `input.arguments`. Without this, destructured params are `undefined`.
- `app.mcpTool()` uses `toolProperties` with fluent `arg` builder — NOT `inputSchema` with JSON Schema
- Handlers must return plain strings (or objects), NOT `{ content: [...] }` — the framework wraps automatically
- The Atera account endpoint is `/account` (not `/myaccount`)
- Local dev needs Azurite running; without it the function host becomes unhealthy after ~5 minutes
- Import paths in `src/` must use `.js` extensions (e.g., `"../helpers/parseArgs.js"`) for Node16 module resolution

### Atera API Conventions

- Base URL: `https://app.atera.com/api/v3`
- Auth: `X-API-KEY` header
- Responses use PascalCase field names — passed through as-is (no camelCase conversion)
- Paginated responses from API: `{ items, totalPages, page, prevLink, nextLink }`
- All list tools accept `page` and `itemsInPage` optional parameters

### Deployment (Flex Consumption)

`azd up` builds TypeScript locally, then stages a self-contained deployment package:

1. `npm run build` compiles TS → `dist/`
2. `scripts/prepare-deploy.js` creates `.azure-deploy/` with `dist/`, `host.json`, a sanitized `package.json` (no scripts, no devDependencies), and production `node_modules/`
3. `azd` packages `.azure-deploy/` (not the project root) and deploys to blob storage

Key constraints of Flex Consumption SKU:
- Does NOT support `ENABLE_ORYX_BUILD` or `SCM_DO_BUILD_DURING_DEPLOYMENT` app settings — never add these to Bicep
- Oryx runs by default on zip deploy — the staged `package.json` must have no `scripts` and no `devDependencies` to prevent build attempts
- `azure.yaml` uses `dist: .azure-deploy` and `language: js` to package the staging directory

### Infrastructure

Bicep templates in `infra/` deploy a Flex Consumption Function App with Storage and App Insights. `main.bicep` is subscription-scoped (creates the resource group). `infra/app/api.bicep` contains the actual resources (blob-based deployment, system-assigned managed identity). `ATERA_API_KEY` is passed as a secure parameter.
