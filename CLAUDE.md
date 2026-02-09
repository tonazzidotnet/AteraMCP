# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm run build          # Compile TypeScript (tsc)
npm run clean          # Remove dist/
npm start              # Clean + build + func start (runs prestart hook)
npm run watch          # TypeScript watch mode (for development alongside func start)
```

Local dev requires Azure Functions Core Tools (`func`) and a valid `ATERA_API_KEY` in `local.settings.json`.

MCP endpoint: `http://localhost:7071/runtime/webhooks/mcp`

Deploy: `azd up` (uses `azure.yaml` and `infra/` Bicep templates)

## Architecture

This is an MCP (Model Context Protocol) server hosted on Azure Functions v4 (Node.js 20, TypeScript). It exposes 11 read-only tools that wrap the Atera RMM REST API, allowing AI agents to query Atera data.

### Request Flow

```
MCP Client → Azure Functions MCP endpoint → app.mcpTool() handler → ateraClient → Atera API v3
```

Each tool handler in `src/functions/` calls the shared HTTP client (`src/clients/ateraClient.ts`), which adds the `X-API-KEY` header and calls the Atera API using native `fetch`. Responses are returned as JSON strings in MCP content format: `{ content: [{ type: "text", text: "..." }] }`.

### Key Modules

- **`src/clients/ateraClient.ts`** — Two functions: `ateraGet<T>(path, params)` for single-entity endpoints, `ateraGetPaginated<T>(path, params)` for list endpoints. Both read `ATERA_API_KEY` from env.
- **`src/types/atera.ts`** — TypeScript interfaces matching Atera's PascalCase JSON responses.
- **`src/functions/`** — Tool registrations grouped by Atera domain: `account.ts` (1 tool), `customers.ts` (2), `contracts.ts` (3), `tickets.ts` (5).
- **`src/helpers/`** — `errorHandler.ts` (formats caught errors as JSON), `responseFormatter.ts` (JSON serialization + paginated result wrapper).

### MCP Tool Registration Pattern

Tools use `app.mcpTool()` with the `toolProperties` field (NOT `inputSchema`) and the fluent `arg` builder:

```typescript
import { app, arg } from "@azure/functions";

app.mcpTool("tool_name", {
  toolName: "tool_name",
  description: "...",
  toolProperties: {
    requiredParam: arg.number().describe("..."),
    optionalParam: arg.string().describe("...").optional(),
  },
  handler: async ({ requiredParam, optionalParam }: { ... }) => {
    // return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});
```

### Atera API Conventions

- Base URL: `https://app.atera.com/api/v3`
- Auth: `X-API-KEY` header
- Responses use PascalCase field names — passed through as-is (no camelCase conversion)
- Paginated responses from API: `{ items, totalPages, page, prevLink, nextLink }`
- All list tools accept `page` and `itemsInPage` optional parameters

### Infrastructure

Bicep templates in `infra/` deploy a Flex Consumption Function App with Storage and App Insights. `main.bicep` is subscription-scoped (creates the resource group). `infra/app/api.bicep` contains the actual resources. `ATERA_API_KEY` is passed as a secure parameter.
