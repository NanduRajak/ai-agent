import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "@/inngest/utils";
import { createAgent, gemini } from "@inngest/agent-kit";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-nandu");
      return sandbox.sandboxId;
    });
    const codeAgent = createAgent({
      name: "summerizer",
      system:
        "You are an expert nextjs developer. You write,readable and maitainable code.You write simple Next.js & React snippets",
      model: gemini({ model: "gemini-2.0-flash" }),
    });

    const { output } = await codeAgent.run(
      `Summerize the following text: ${event.data.value}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { output, sandboxUrl };
  }
);
