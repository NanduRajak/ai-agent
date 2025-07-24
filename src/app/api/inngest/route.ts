import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  simplifiedCodeAgentFunction,
  updateSandboxFilesFunction,
} from "@/inngest/functions-simplified";

// Create an API that serves the functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [simplifiedCodeAgentFunction, updateSandboxFilesFunction],
});
