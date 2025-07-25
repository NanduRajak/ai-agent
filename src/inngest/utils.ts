import Sandbox from "@e2b/code-interpreter";
import { AgentResult, Message, TextMessage } from "@inngest/agent-kit";

/**
 * Extracts sandbox ID from an E2B sandbox URL
 * URL format: https://sandboxId-port.e2b.dev
 * Example: https://itwpgu0xn55atpf7xisfr-3000.e2b.dev -> itwpgu0xn55atpf7xisfr
 */
export function extractSandboxId(sandboxUrl: string): string {
  try {
    // Remove protocol
    const withoutProtocol = sandboxUrl.split("://")[1];
    if (!withoutProtocol) {
      throw new Error("Invalid URL format - missing protocol");
    }

    // Extract the subdomain part (before .e2b.dev)
    const subdomain = withoutProtocol.split(".")[0];
    if (!subdomain) {
      throw new Error("Invalid URL format - missing subdomain");
    }

    // Remove port suffix (everything after the last hyphen)
    const sandboxId = subdomain.split("-")[0];
    if (!sandboxId) {
      throw new Error("Invalid URL format - missing sandbox ID");
    }

    console.log(`Extracted sandbox ID: ${sandboxId} from URL: ${sandboxUrl}`);
    return sandboxId;
  } catch (error) {
    console.error(
      `Failed to extract sandbox ID from URL: ${sandboxUrl}`,
      error
    );
    throw new Error(`Invalid sandbox URL format: ${sandboxUrl}`);
  }
}

export async function getSandbox(sandboxId: string) {
  try {
    console.log(`Attempting to connect to sandbox: ${sandboxId}`);
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.setTimeout(60_000 * 10 * 3);
    console.log(`Successfully connected to sandbox: ${sandboxId}`);
    return sandbox;
  } catch (error) {
    console.error(`Failed to connect to sandbox: ${sandboxId}`, error);

    // Check if it's a "sandbox not found" error specifically
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("404")
    ) {
      throw new Error(
        `Sandbox ${sandboxId} no longer exists or has expired. Please create a new project.`
      );
    }

    throw new Error(`Sandbox connection failed: ${sandboxId}. ${errorMessage}`);
  }
}
export function lastAssisstantTextMessageContent(result: AgentResult) {
  const lastAssisstantTextMessageIndex = result.output.findIndex(
    (message) => message.role === "assistant"
  );

  const message = result.output[lastAssisstantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}

export const parseAgentOutput = (value: Message[]) => {
  const output = value[0];
  if (output.type !== "text") {
    return "Fragment";
  }
  if (Array.isArray(output.content)) {
    return output.content.map((txt) => txt).join("");
  } else {
    return output.content;
  }
};
