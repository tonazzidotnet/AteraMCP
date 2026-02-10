import { app, arg } from "@azure/functions";
import { ateraGet, ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraContract } from "../types/atera.js";
import { toJson, paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

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
  handler: async (input: unknown) => {
    const { page, itemsInPage } = parseArgs<{ page?: number; itemsInPage?: number }>(input);
    try {
      const result = await ateraGetPaginated<AteraContract>("/contracts", {
        page: page ?? 1,
        itemsInPage: itemsInPage ?? 20,
      });
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});

app.mcpTool("atera_get_contract", {
  toolName: "atera_get_contract",
  description: "Get a single Atera contract by ID.",
  toolProperties: {
    contractId: arg.number().describe("The contract ID"),
  },
  handler: async (input: unknown) => {
    const { contractId } = parseArgs<{ contractId: number }>(input);
    try {
      const contract = await ateraGet<AteraContract>(
        `/contracts/${contractId}`
      );
      return toJson(contract);
    } catch (error) {
      return formatError(error);
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
  handler: async (input: unknown) => {
    const { customerId, page, itemsInPage } = parseArgs<{
      customerId: number;
      page?: number;
      itemsInPage?: number;
    }>(input);
    try {
      const result = await ateraGetPaginated<AteraContract>(
        `/contracts/customer/${customerId}`,
        {
          page: page ?? 1,
          itemsInPage: itemsInPage ?? 20,
        }
      );
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});
