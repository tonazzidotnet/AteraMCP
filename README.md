# Atera MCP Server

An [MCP](https://modelcontextprotocol.io/) server hosted on Azure Functions that wraps the [Atera RMM API](https://app.atera.com/apidocs), giving AI agents read-only access to your Atera account data.

## Tools

| Tool | Description |
|------|-------------|
| `atera_get_account` | Get account info (plan, usage) — connectivity check |
| `atera_list_customers` | List customers (paginated) |
| `atera_get_customer` | Get customer by ID |
| `atera_list_contracts` | List contracts (paginated) |
| `atera_get_contract` | Get contract by ID |
| `atera_list_contracts_by_customer` | List contracts for a customer |
| `atera_list_tickets` | List tickets with optional status/customer filters |
| `atera_get_ticket` | Get ticket by ID |
| `atera_list_ticket_comments` | List comments on a ticket |
| `atera_get_ticket_work_hours` | Get work hours for a ticket |
| `atera_get_ticket_billable_duration` | Get billable duration for a ticket |

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) — `npm install -g azurite`
- An [Atera API key](https://support.atera.com/hc/en-us/articles/219083397-APIs) (Admin > API in your Atera dashboard)

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/tonazzidotnet/AteraMCP.git
   cd AteraMCP
   npm install
   ```

2. **Configure your API key** — edit `local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "ATERA_API_KEY": "<your-atera-api-key>"
     }
   }
   ```

3. **Start Azurite** (in a separate terminal):
   ```bash
   azurite --silent
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Verify** — the MCP endpoint is available at:
   ```
   http://localhost:7071/runtime/webhooks/mcp
   ```

## Connecting an MCP Client

The endpoint uses **Streamable HTTP** transport (POST requests). A `mcp.json` template is included for client configuration.

**Local** (no auth required):
```json
{
  "type": "sse",
  "url": "http://localhost:7071/runtime/webhooks/mcp"
}
```

**Remote** (deployed to Azure, requires system key):
```json
{
  "type": "sse",
  "url": "https://<your-function-app>.azurewebsites.net/runtime/webhooks/mcp",
  "headers": {
    "x-functions-key": "<system-key>"
  }
}
```

## Testing with curl

```bash
# List all tools
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  http://localhost:7071/runtime/webhooks/mcp

# Check connectivity
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"atera_get_account","arguments":{}}}' \
  http://localhost:7071/runtime/webhooks/mcp
```

## Deploy to Azure

```bash
azd up
```

This deploys a Flex Consumption Function App with Storage and Application Insights using the Bicep templates in `infra/`. The `ATERA_API_KEY` is passed as a secure parameter.

## Tech Stack

- **Runtime**: Azure Functions v4, Node.js 20, TypeScript
- **MCP**: Azure Functions MCP extension (`app.mcpTool()`)
- **HTTP**: Native `fetch` (no external HTTP libraries)
- **IaC**: Bicep (Flex Consumption plan)
