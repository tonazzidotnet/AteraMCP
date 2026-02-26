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
| `atera_list_tickets_by_technician` | List all tickets for a technician (all pages, slim fields — avoids token limits) |
| `atera_search_tickets` | Search tickets by keyword in title and description |
| `atera_list_agents` | List devices (servers, PCs) by customer or search by device name |
| `atera_list_contacts` | List contacts (employees) by customer or search by name |

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
       "AzureWebJobsSecretStorageType": "Files",
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

The endpoint uses **Streamable HTTP** transport (POST requests). A ready-to-use `mcp.json` template is included — most MCP clients (VS Code Copilot, Claude Desktop, etc.) can import it directly.

**Local** (no auth required):
```json
{
  "type": "sse",
  "url": "http://localhost:7071/runtime/webhooks/mcp"
}
```

**Remote** (deployed to Azure, requires system key — see [Deploy to Azure](#deploy-to-azure) for how to retrieve it):
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

# Check connectivity (no arguments)
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"atera_get_account","arguments":{}}}' \
  http://localhost:7071/runtime/webhooks/mcp

# Call a tool with arguments
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"atera_get_ticket","arguments":{"ticketId":5556}}}' \
  http://localhost:7071/runtime/webhooks/mcp
```

## Deploy to Azure

### Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (`az`)
- [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) (`azd`)
- An Azure subscription

### Step-by-step

1. **Log in** to the Azure Developer CLI:
   ```bash
   azd auth login
   ```

2. **Initialize** the environment (first time only):
   ```bash
   azd init
   ```
   Pick an environment name (e.g. `atera-mcp-prod`). This name prefixes all Azure resources.

3. **Set your Atera API key**:
   ```bash
   azd env set ATERA_API_KEY <your-atera-api-key>
   ```

4. **Deploy everything** (infrastructure + code):
   ```bash
   azd up
   ```
   You'll be prompted to select an Azure subscription and location. This creates:
   - Resource group
   - Storage account
   - Application Insights
   - Flex Consumption Function App

   The MCP endpoint URL is printed in the output when deployment completes.

5. **Retrieve the system key** (required for remote MCP clients):
   ```bash
   az functionapp keys list \
     --name <your-function-app-name> \
     --resource-group <your-resource-group> \
     --query systemKeys.default -o tsv
   ```

6. **Connect your MCP client** using the remote URL and system key:
   ```json
   {
     "type": "sse",
     "url": "https://<your-function-app>.azurewebsites.net/runtime/webhooks/mcp",
     "headers": {
       "x-functions-key": "<system-key>"
     }
   }
   ```

7. **Verify** the remote endpoint:
   ```bash
   curl -s -X POST \
     -H "Content-Type: application/json" \
     -H "x-functions-key: <system-key>" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
     https://<your-function-app>.azurewebsites.net/runtime/webhooks/mcp
   ```

### Subsequent deploys

To push code changes without re-provisioning infrastructure:

```bash
azd deploy
```

## Tech Stack

- **Runtime**: Azure Functions v4, Node.js 20, TypeScript
- **MCP**: Azure Functions MCP extension (`app.mcpTool()`)
- **HTTP**: Native `fetch` (no external HTTP libraries)
- **IaC**: Bicep (Flex Consumption plan)

## Contributing

See [CLAUDE.md](CLAUDE.md) for architecture details, tool registration patterns, and deployment gotchas.
