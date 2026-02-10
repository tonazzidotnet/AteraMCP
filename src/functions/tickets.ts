import { app, arg } from "@azure/functions";
import { ateraGet, ateraGetPaginated } from "../clients/ateraClient.js";
import {
  AteraTicket,
  AteraTicketComment,
  AteraTicketWorkHours,
  AteraTicketBillableDuration,
} from "../types/atera.js";
import { toJson, paginatedResult } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";
import { parseArgs } from "../helpers/parseArgs.js";

app.mcpTool("atera_list_tickets", {
  toolName: "atera_list_tickets",
  description:
    "List Atera tickets with optional filters for status and customer.",
  toolProperties: {
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
    ticketStatus: arg
      .string()
      .describe("Filter by status: Open, Pending, Resolved, Closed, or Deleted")
      .optional(),
    customerId: arg.number().describe("Filter by customer ID").optional(),
  },
  handler: async (input: unknown) => {
    const { page, itemsInPage, ticketStatus, customerId } = parseArgs<{
      page?: number;
      itemsInPage?: number;
      ticketStatus?: string;
      customerId?: number;
    }>(input);
    try {
      const result = await ateraGetPaginated<AteraTicket>("/tickets", {
        page: page ?? 1,
        itemsInPage: itemsInPage ?? 20,
        ticketStatus,
        customerId,
      });
      return paginatedResult(result.items, result.page, result.totalPages);
    } catch (error) {
      return formatError(error);
    }
  },
});

app.mcpTool("atera_get_ticket", {
  toolName: "atera_get_ticket",
  description: "Get a single Atera ticket by ID.",
  toolProperties: {
    ticketId: arg.number().describe("The ticket ID"),
  },
  handler: async (input: unknown) => {
    const { ticketId } = parseArgs<{ ticketId: number }>(input);
    try {
      const ticket = await ateraGet<AteraTicket>(`/tickets/${ticketId}`);
      return toJson(ticket);
    } catch (error) {
      return formatError(error);
    }
  },
});

app.mcpTool("atera_list_ticket_comments", {
  toolName: "atera_list_ticket_comments",
  description: "List all comments on an Atera ticket.",
  toolProperties: {
    ticketId: arg.number().describe("The ticket ID"),
    page: arg.number().describe("Page number (default 1)").optional(),
    itemsInPage: arg
      .number()
      .describe("Items per page (default 20, max 50)")
      .optional(),
  },
  handler: async (input: unknown) => {
    const { ticketId, page, itemsInPage } = parseArgs<{
      ticketId: number;
      page?: number;
      itemsInPage?: number;
    }>(input);
    try {
      const result = await ateraGetPaginated<AteraTicketComment>(
        `/tickets/${ticketId}/comments`,
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

app.mcpTool("atera_get_ticket_work_hours", {
  toolName: "atera_get_ticket_work_hours",
  description: "Get work hours logged on an Atera ticket.",
  toolProperties: {
    ticketId: arg.number().describe("The ticket ID"),
  },
  handler: async (input: unknown) => {
    const { ticketId } = parseArgs<{ ticketId: number }>(input);
    try {
      const workHours = await ateraGet<AteraTicketWorkHours[]>(
        `/tickets/${ticketId}/workhours`
      );
      return toJson(workHours);
    } catch (error) {
      return formatError(error);
    }
  },
});

app.mcpTool("atera_get_ticket_billable_duration", {
  toolName: "atera_get_ticket_billable_duration",
  description: "Get billable and non-billable duration for an Atera ticket.",
  toolProperties: {
    ticketId: arg.number().describe("The ticket ID"),
  },
  handler: async (input: unknown) => {
    const { ticketId } = parseArgs<{ ticketId: number }>(input);
    try {
      const duration = await ateraGet<AteraTicketBillableDuration>(
        `/tickets/${ticketId}/billableduration`
      );
      return toJson(duration);
    } catch (error) {
      return formatError(error);
    }
  },
});
