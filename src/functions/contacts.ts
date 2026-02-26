import { app, arg } from "@azure/functions";
import { ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraContact } from "../types/atera.js";
import { paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("atera_list_contacts", {
  toolName: "atera_list_contacts",
  description:
    "List contacts (end users / employees) from Atera. " +
    "If customerId is provided, returns all contacts for that customer. " +
    "If name is provided, searches all pages for contacts matching that name (case-insensitive, checks first and last name). " +
    "If neither is provided, returns a paginated list of all contacts.",
  toolProperties: {
    customerId: arg
      .number()
      .describe("Filter by customer ID")
      .optional(),
    name: arg
      .string()
      .describe(
        "Search for a contact by name (case-insensitive substring match on first or last name, searches all pages)"
      )
      .optional(),
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
  },
  handler: async (input: unknown) => {
    const { customerId, name, page, itemsInPage } = parseArgs<{
      customerId?: number;
      name?: string;
      page?: number;
      itemsInPage?: number;
    }>(input);
    try {
      // Search by name across all pages
      if (name) {
        const searchName = name.toLowerCase();
        const allMatches: AteraContact[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const result = await ateraGetPaginated<AteraContact>("/contacts", {
            page: currentPage,
            itemsInPage: 50,
          });
          totalPages = result.totalPages;

          for (const contact of result.items) {
            const fullName =
              `${contact.Firstname ?? ""} ${contact.Lastname ?? ""}`.toLowerCase();
            if (fullName.includes(searchName)) {
              allMatches.push(contact);
            }
          }
          currentPage++;
        } while (currentPage <= totalPages);

        return JSON.stringify({
          count: allMatches.length,
          contacts: allMatches,
        });
      }

      // Filter by customer
      const path = customerId
        ? `/contacts/customer/${customerId}`
        : "/contacts";

      const result = await ateraGetPaginated<AteraContact>(path, {
        page,
        itemsInPage,
      });
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});
