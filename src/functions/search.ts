import { app, arg } from "@azure/functions";
import { ateraGetPaginated } from "../clients/ateraClient.js";
import { AteraTicket, AteraTicketSlim } from "../types/atera.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("atera_search_tickets", {
  toolName: "atera_search_tickets",
  description:
    "Search tickets by keyword across title and description. " +
    "Fetches all pages and returns slim results to avoid token limits. " +
    "Use this to answer questions like 'Have we had this problem before?' or 'Find tickets about Outlook'. " +
    "Optionally filter by customer or status.",
  toolProperties: {
    query: arg
      .string()
      .describe(
        "Keyword to search for in ticket title and description (case-insensitive)"
      ),
    customerId: arg
      .number()
      .describe("Optional: narrow search to a specific customer ID")
      .optional(),
    ticketStatus: arg
      .string()
      .describe(
        "Optional: filter by status: Open, Pending, Resolved, Closed, or Deleted"
      )
      .optional(),
  },
  handler: async (input: unknown) => {
    const { query, customerId, ticketStatus } = parseArgs<{
      query: string;
      customerId?: number;
      ticketStatus?: string;
    }>(input);
    try {
      const searchTerm = query.toLowerCase();
      const matches: AteraTicketSlim[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const result = await ateraGetPaginated<AteraTicket>("/tickets", {
          page,
          itemsInPage: 50,
          ticketStatus,
          customerId,
        });
        totalPages = result.totalPages;

        for (const t of result.items) {
          const inTitle = t.TicketTitle?.toLowerCase().includes(searchTerm);
          const inDescription = t.Description?.toLowerCase().includes(searchTerm);

          if (inTitle || inDescription) {
            matches.push({
              TicketID: t.TicketID,
              TicketTitle: t.TicketTitle,
              TicketStatus: t.TicketStatus,
              TicketPriority: t.TicketPriority,
              CustomerName: t.CustomerName,
              TechnicianFullName:
                t.TechnicianFullName ??
                `${t.FirstTechnicianFirstName ?? ""} ${t.FirstTechnicianLastName ?? ""}`.trim(),
              CreatedDate: t.CreatedDate,
            });
          }
        }
        page++;
      } while (page <= totalPages);

      return JSON.stringify({
        query,
        ticketStatus: ticketStatus ?? "all",
        customerId: customerId ?? "all",
        count: matches.length,
        tickets: matches,
      });
    } catch (error) {
      return formatError(error);
    }
  },
});
