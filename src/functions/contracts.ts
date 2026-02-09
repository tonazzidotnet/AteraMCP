import { app, arg } from "@azure/functions";
import { ateraGet, ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraContract } from "../types/atera.js";
import { toJson, paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";

app.mcpTool("atera_list_contracts", {
  toolName: "atera_list_contracts",
  description: "List all Atera contracts with pagination.",
  toolProperties: {
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
  },
  handler: async ({ page, itemsInPage }: { page?: number; itemsInPage?: number }) => {
    try {
      const result = await ateraGetPaginated<AteraContract>("/contracts", {
        page: page ?? 1,
        itemsInPage: itemsInPage ?? 20,
      });
      return {
        content: [
          {
            type: "text",
            text: paginatedResult(result.items, result.page, result.totalPages),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: formatError(error) }] };
    }
  },
});

app.mcpTool("atera_get_contract", {
  toolName: "atera_get_contract",
  description: "Get a single Atera contract by ID.",
  toolProperties: {
    contractId: arg.number().describe("The contract ID"),
  },
  handler: async ({ contractId }: { contractId: number }) => {
    try {
      const contract = await ateraGet<AteraContract>(
        `/contracts/${contractId}`
      );
      return { content: [{ type: "text", text: toJson(contract) }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatError(error) }] };
    }
  },
});

app.mcpTool("atera_list_contracts_by_customer", {
  toolName: "atera_list_contracts_by_customer",
  description: "List all contracts for a specific Atera customer.",
  toolProperties: {
    customerId: arg.number().describe("The customer ID"),
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
  },
  handler: async ({
    customerId,
    page,
    itemsInPage,
  }: {
    customerId: number;
    page?: number;
    itemsInPage?: number;
  }) => {
    try {
      const result = await ateraGetPaginated<AteraContract>(
        `/contracts/customer/${customerId}`,
        {
          page: page ?? 1,
          itemsInPage: itemsInPage ?? 20,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: paginatedResult(result.items, result.page, result.totalPages),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: formatError(error) }] };
    }
  },
});
