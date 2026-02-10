import { app, arg } from "@azure/functions";
import { ateraGet, ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraCustomer } from "../types/atera.js";
import { toJson, paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("atera_list_customers", {
  toolName: "atera_list_customers",
  description: "List all Atera customers with pagination.",
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
      const result = await ateraGetPaginated<AteraCustomer>("/customers", {
        page: page ?? 1,
        itemsInPage: itemsInPage ?? 20,
      });
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});

app.mcpTool("atera_get_customer", {
  toolName: "atera_get_customer",
  description: "Get a single Atera customer by ID.",
  toolProperties: {
    customerId: arg.number().describe("The customer ID"),
  },
  handler: async (input: unknown) => {
    const { customerId } = parseArgs<{ customerId: number }>(input);
    try {
      const customer = await ateraGet<AteraCustomer>(
        `/customers/${customerId}`
      );
      return toJson(customer);
    } catch (error) {
      return formatError(error);
    }
  },
});
