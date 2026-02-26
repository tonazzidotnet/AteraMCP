import { app, arg } from "@azure/functions";
import { ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraAgent } from "../types/atera.js";
import { paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("atera_list_agents", {
  toolName: "atera_list_agents",
  description:
    "List devices (servers, PCs, laptops) from Atera. " +
    "If customerId is provided, returns all devices for that customer. " +
    "If agentName is provided, searches all pages for devices matching that name (case-insensitive). " +
    "If neither is provided, returns a paginated list of all devices.",
  toolProperties: {
    customerId: arg
      .number()
      .describe("Filter by customer ID")
      .optional(),
    agentName: arg
      .string()
      .describe(
        "Search for a device by name (case-insensitive substring match, searches all pages)"
      )
      .optional(),
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
  },
  handler: async (input: unknown) => {
    const { customerId, agentName, page, itemsInPage } = parseArgs<{
      customerId?: number;
      agentName?: string;
      page?: number;
      itemsInPage?: number;
    }>(input);
    try {
      // Search by name across all pages
      if (agentName) {
        const searchName = agentName.toLowerCase();
        const allMatches: AteraAgent[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const result = await ateraGetPaginated<AteraAgent>("/agents", {
            page: currentPage,
            itemsInPage: 50,
          });
          totalPages = result.totalPages;

          for (const agent of result.items) {
            if (
              agent.AgentName?.toLowerCase().includes(searchName) ||
              agent.MachineName?.toLowerCase().includes(searchName)
            ) {
              allMatches.push(agent);
            }
          }
          currentPage++;
        } while (currentPage <= totalPages);

        return JSON.stringify({ count: allMatches.length, agents: allMatches });
      }

      // Filter by customer
      const path = customerId
        ? `/agents/customer/${customerId}`
        : "/agents";

      const result = await ateraGetPaginated<AteraAgent>(path, {
        page,
        itemsInPage,
      });
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});
