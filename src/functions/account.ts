import { app } from "@azure/functions";
import { ateraGet } from "../clients/ateraClient.js";
import { AteraAccount } from "../types/atera.js";
import { toJson } from "../helpers/responseFormatter.js";
import { formatError } from "../helpers/errorHandler.js";

app.mcpTool("atera_get_account", {
  toolName: "atera_get_account",
  description:
    "Get Atera account information including plan name and agent usage. Useful as a connectivity check.",
  toolProperties: {},
  handler: async () => {
    try {
      const account = await ateraGet<AteraAccount>("/account");
      return toJson(account);
    } catch (error) {
      return formatError(error);
    }
  },
});
