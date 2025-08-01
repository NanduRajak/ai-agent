import { Sandbox } from "@e2b/code-interpreter";
import {
  getSandbox,
  parseAgentOutput,
  extractSandboxId,
} from "@/inngest/utils";
import { createAgent, createTool, openai } from "@inngest/agent-kit";
import { z } from "zod";

import { inngest } from "./client";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

// Ensure environment variables are loaded
if (!process.env.E2B_API_KEY) {
  console.error("E2B_API_KEY environment variable is not set");
}

export const simplifiedCodeAgentFunction = inngest.createFunction(
  { id: "simplified-code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    console.log("🚀 Simplified AI Agent Function Started");
    console.log("Event data:", JSON.stringify(event.data, null, 2));

    const functionState = {
      files: {} as { [path: string]: string },
      sandboxId: "",
      hasFiles: false,
    };
    console.log("Environment check:");
    console.log(
      "- E2B_API_KEY:",
      process.env.E2B_API_KEY ? "AVAILABLE" : "MISSING"
    );
    console.log(
      "- OPENAI_API_KEY:",
      process.env.OPENAI_API_KEY ? "AVAILABLE" : "MISSING"
    );

    const sandboxId = await step.run("create-sandbox", async () => {
      try {
        console.log("Creating E2B sandbox...");

        // Try with template name first, fallback to template ID
        let sandbox;
        try {
          sandbox = await Sandbox.create("vibe-nextjs-nandu");
          console.log(
            "✅ Sandbox created with template name:",
            sandbox.sandboxId
          );
        } catch (nameError) {
          console.warn(
            "⚠️ Template name failed, trying template ID:",
            nameError
          );
          sandbox = await Sandbox.create("d622vkz8p86647vfbfsu");
          console.log(
            "✅ Sandbox created with template ID:",
            sandbox.sandboxId
          );
        }

        await sandbox.setTimeout(60_000 * 10);
        functionState.sandboxId = sandbox.sandboxId;
        return sandbox.sandboxId;
      } catch (error) {
        console.error("❌ Failed to create E2B sandbox:", error);

        // Provide more specific error messages
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("401")
        ) {
          throw new Error(
            "E2B API key is invalid or missing. Please check your environment variables."
          );
        } else if (
          errorMessage.includes("template") ||
          errorMessage.includes("not found")
        ) {
          throw new Error(
            "E2B template 'vibe-nextjs-nandu' not found. Please ensure the template exists."
          );
        }

        throw error;
      }
    });

    const createdFiles: { [path: string]: string } = {};

    const agentResult = await step.run("run-agent", async () => {
      console.log("🚀 Starting simplified AI agent execution...");

      // Track files that will be created during agent execution
      const aggregatedFiles: { [path: string]: string } = {};

      // Modified createFiles tool that returns files for aggregation
      const createFilesToolWithTracking = createTool({
        name: "createFiles",
        description:
          "Create files in the sandbox - MUST BE USED FOR EVERY REQUEST",
        parameters: z.object({
          files: z.array(
            z.object({
              path: z.string(),
              content: z.string(),
            })
          ),
        }),
        handler: async ({ files }) => {
          console.log("🎯 createFiles tool called - SUCCESS!");
          console.log(
            `Creating ${files.length} files:`,
            files.map((f) => f.path)
          );

          try {
            const sandbox = await getSandbox(sandboxId);

            for (const file of files) {
              console.log(
                `Writing file: ${file.path} (${file.content.length} chars)`
              );

              // Ensure directory exists
              const dirPath = file.path.substring(
                0,
                file.path.lastIndexOf("/")
              );
              if (dirPath) {
                await sandbox.commands.run(`mkdir -p ${dirPath}`);
              }

              await sandbox.files.write(file.path, file.content);
              aggregatedFiles[file.path] = file.content; // Track in aggregated files
              console.log(`✅ Created: ${file.path}`);
            }

            // Ensure main page exists
            if (
              !aggregatedFiles["app/page.tsx"] &&
              !aggregatedFiles["pages/index.tsx"]
            ) {
              console.log("Adding default app/page.tsx");
              const defaultPage = `export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Generated App</h1>
      <p>This app was generated by AI agent. Check the components above!</p>
    </div>
  );
}`;
              await sandbox.files.write("app/page.tsx", defaultPage);
              aggregatedFiles["app/page.tsx"] = defaultPage;
            }

            // Restart Next.js server
            console.log("Restarting development server...");
            try {
              await sandbox.commands.run('pkill -f "next dev"');
              await new Promise((r) => setTimeout(r, 3000));
            } catch {
              console.log("No server to kill");
            }

            // Start the server and wait for it to be ready
            console.log("Starting Next.js development server...");
            sandbox.commands.run("cd /home/user && npm run dev", {
              onStdout: (data) => console.log("Next.js:", data),
              onStderr: (data) => console.log("Next.js error:", data),
            });

            // Wait longer for server to start up
            console.log("Waiting for server to start...");
            await new Promise((r) => setTimeout(r, 8000));

            // Verify server is running
            try {
              const healthCheck = await sandbox.commands.run(
                "curl -f http://localhost:3000 || echo 'Server not ready'"
              );
              console.log("Server health check:", healthCheck.stdout);
            } catch (error) {
              console.log("Health check failed:", error);
            }

            await new Promise((r) => setTimeout(r, 8000)); // Wait for server

            console.log("🎉 Files created successfully!");
            console.log("Aggregated files:", Object.keys(aggregatedFiles));
            return `Successfully created ${
              Object.keys(aggregatedFiles).length
            } files: ${Object.keys(aggregatedFiles).join(", ")}`;
          } catch (error) {
            console.error("❌ File creation failed:", error);
            throw error;
          }
        },
      });

      // Create agent with the tracking version of the tool
      const simplifiedAgentWithTracking = createAgent({
        name: "simplified-code-agent",
        description: "A focused coding agent that creates files",
        system: `${PROMPT}

CRITICAL INSTRUCTIONS:
- You MUST use the createFiles tool to create all necessary files
- Always create app/page.tsx as your main application file
- After creating files, respond with: <task_summary>Brief description of what you built</task_summary>
- Do not skip file creation - it is mandatory`,
        model: openai({
          model: "gpt-4o-mini",
          defaultParameters: {
            temperature: 0.1,
          },
        }),
        tools: [
          createFilesToolWithTracking,
          createTool({
            name: "terminal",
            description: "Run terminal commands in the sandbox",
            parameters: z.object({
              command: z.string(),
            }),
            handler: async ({ command }) => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command);
                return result.stdout || result.stderr || "Command completed";
              } catch (e) {
                return `Error: ${e}`;
              }
            },
          }),
        ],
      });

      const result = await simplifiedAgentWithTracking.run(event.data.value);
      console.log("🎯 Agent execution completed!");

      // Return both the result and the aggregated files
      return {
        agentOutput: result,
        filesCreated: aggregatedFiles,
        hasFiles: Object.keys(aggregatedFiles).length > 0,
      };
    });

    // Extract task summary from agent response
    let taskSummary = "";
    if (agentResult.agentOutput.output) {
      const lastMessage =
        agentResult.agentOutput.output[
          agentResult.agentOutput.output.length - 1
        ];
      if (
        lastMessage &&
        typeof lastMessage === "object" &&
        "content" in lastMessage
      ) {
        const content = lastMessage.content;
        if (typeof content === "string" && content.includes("<task_summary>")) {
          taskSummary = content;
        }
      }
    }

    const hasFiles = Object.keys(createdFiles).length > 0;
    const hasStepFiles = Object.keys(agentResult.filesCreated || {}).length > 0;
    const isActualError = !taskSummary && !hasFiles && !hasStepFiles;

    console.log("📊 Final result analysis:");
    console.log("- Has summary:", !!taskSummary);
    console.log("- Has files:", hasFiles);
    console.log("- Files count:", Object.keys(createdFiles).length);
    console.log("- Files created:", Object.keys(createdFiles));
    console.log(
      "- Step files count:",
      Object.keys(agentResult.filesCreated || {}).length
    );
    console.log("- Step files:", Object.keys(agentResult.filesCreated || {}));
    console.log("- Is actual error:", isActualError);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Generate title and response
    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o-mini",
      }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o-mini",
      }),
    });

    const titleResult = await step.run("generate-title", async () => {
      if (taskSummary) {
        const { output } = await fragmentTitleGenerator.run(taskSummary);
        return parseAgentOutput(output);
      }
      return hasFiles ? "Generated App" : "Error";
    });

    const responseResult = await step.run("generate-response", async () => {
      if (taskSummary) {
        const { output } = await responseGenerator.run(taskSummary);
        return parseAgentOutput(output);
      }
      return hasFiles
        ? "I've created your application with the requested functionality. The app has been successfully generated and is ready to use."
        : "The AI agent didn't complete the task properly. Please try again with a clear, specific request.";
    });

    return await step.run("save-result", async () => {
      // CRITICAL FIX: Use files from agent step result
      const actualFiles = agentResult.filesCreated || {};
      const hasFilesActual = Object.keys(actualFiles).length > 0;
      // FIXED: Prioritize file creation over summary - if files are created, it's a success
      const isActualErrorFinal = !hasFilesActual;

      console.log(
        "📊 FINAL SAVE - Files being saved:",
        Object.keys(actualFiles)
      );
      console.log("📊 Agent result files content:", agentResult.filesCreated);

      if (isActualErrorFinal) {
        console.log("❌ AI Agent Error: No files created");
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              "The AI agent didn't complete the task properly. Please try again with a clear, specific request.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      console.log("✅ AI Agent completed successfully!");
      console.log("Sandbox URL:", sandboxUrl);
      console.log("Files to save to database:", Object.keys(actualFiles));

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: responseResult,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: titleResult,
              files: actualFiles, // Use the actual files from agent step
            },
          },
        },
      });
    });
  }
);

export const updateSandboxFilesFunction = inngest.createFunction(
  { id: "update-sandbox-files" },
  { event: "sandbox/update-files" },
  async ({ event, step }) => {
    // Extract sandbox ID from URL using the helper function
    const sandboxId = extractSandboxId(event.data.sandboxUrl);

    return await step.run("update-files", async () => {
      try {
        console.log(
          `🔧 Updating files in sandbox. Original URL: ${event.data.sandboxUrl}`
        );
        console.log(`🔧 Extracted sandbox ID: ${sandboxId}`);

        const sandbox = await getSandbox(sandboxId);
        console.log("Updating files in sandbox:", sandboxId);

        for (const [path, content] of Object.entries(event.data.files)) {
          await sandbox.files.write(path, content as string);
          console.log(`Updated file: ${path}`);
        }

        return { success: true, message: "Files updated successfully" };
      } catch (error) {
        console.error("Error updating sandbox files:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }
);
