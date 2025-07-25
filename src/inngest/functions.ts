import { Sandbox } from "@e2b/code-interpreter";
import {
  getSandbox,
  lastAssisstantTextMessageContent,
  parseAgentOutput,
  extractSandboxId,
} from "@/inngest/utils";
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  openai,
  Message,
  Tool,
} from "@inngest/agent-kit";
import { z } from "zod";

import { inngest } from "./client";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

// Ensure environment variables are loaded
if (!process.env.E2B_API_KEY) {
  console.error("E2B_API_KEY environment variable is not set");
}

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    console.log("🚀 AI Agent Function Started");
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    console.log("Environment check:");
    console.log(
      "- E2B_API_KEY:",
      process.env.E2B_API_KEY ? "AVAILABLE" : "MISSING"
    );
    console.log(
      "- OPENAI_API_KEY:",
      process.env.OPENAI_API_KEY ? "AVAILABLE" : "MISSING"
    );

    const sandboxId = await step.run("get-sandbox-id", async () => {
      try {
        console.log(
          "Creating E2B sandbox with API key:",
          process.env.E2B_API_KEY ? "AVAILABLE" : "MISSING"
        );

        // Try with template name first, fallback to template ID
        let sandbox;
        try {
          sandbox = await Sandbox.create("vibe-nextjs-nandu");
          console.log(
            "Sandbox created successfully with template name:",
            sandbox.sandboxId
          );
        } catch (nameError) {
          console.warn("Template name failed, trying template ID:", nameError);
          sandbox = await Sandbox.create("d622vkz8p86647vfbfsu");
          console.log(
            "Sandbox created successfully with template ID:",
            sandbox.sandboxId
          );
        }

        await sandbox.setTimeout(60_000 * 10);
        return sandbox.sandboxId;
      } catch (error) {
        console.error("Failed to create E2B sandbox:", error);
        console.error(
          "Error message:",
          error instanceof Error ? error.message : String(error)
        );

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

    const previewMessage = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        });
      }
      return formattedMessages.reverse();
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previewMessage,
      }
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An export coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4o-mini",
        defaultParameters: {
          temperature: 0.1,
        },
      }),

      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal for commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (e) {
                console.error(
                  `Command failed:${e} \nstdout: ${buffers.stdout}\nstderror:${buffers.stderr}`
                );
                return `Command failed:${e} \nstdout: ${buffers.stdout}\nstderror:${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            console.log("🔧 createOrUpdateFiles tool called!");
            console.log(
              "Files to create:",
              files.map((f) => ({ path: f.path, size: f.content.length }))
            );

            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  console.log(
                    "Starting file creation with sandboxId:",
                    sandboxId
                  );
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  console.log("Successfully connected to sandbox");
                  console.log(
                    `Creating ${files.length} files:`,
                    files.map((f) => f.path)
                  );
                  for (const file of files) {
                    console.log(
                      `Writing file: ${file.path} (${file.content.length} chars)`
                    );

                    // Ensure directory exists for the file
                    const dirPath = file.path.substring(
                      0,
                      file.path.lastIndexOf("/")
                    );
                    if (dirPath) {
                      await sandbox.commands.run(`mkdir -p ${dirPath}`);
                    }

                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                    console.log(`Successfully created file: ${file.path}`);
                  }

                  // For Next.js apps, make sure we're creating the main page
                  if (
                    !updatedFiles["app/page.tsx"] &&
                    !updatedFiles["pages/index.tsx"]
                  ) {
                    console.log(
                      "Creating default app/page.tsx since no main page was created"
                    );
                    const defaultPageContent = `export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Generated App</h1>
      <p>This app was generated by AI agent. Check the components above!</p>
    </div>
  );
}`;
                    await sandbox.files.write(
                      "app/page.tsx",
                      defaultPageContent
                    );
                    updatedFiles["app/page.tsx"] = defaultPageContent;
                  }

                  // Restart the development server to pick up new files
                  console.log("Restarting Next.js server...");
                  try {
                    await sandbox.commands.run('pkill -f "next dev"', {
                      onStdout: () => {},
                      onStderr: () => {},
                    });
                  } catch {
                    console.log("No existing dev server to kill");
                  }

                  // Give it a moment then restart
                  await new Promise((resolve) => setTimeout(resolve, 3000));

                  // Start the development server in background
                  console.log("Starting Next.js development server...");
                  sandbox.commands.run("cd /home/user && npm run dev", {
                    onStdout: (data) => console.log("Next.js:", data),
                    onStderr: (data) => console.log("Next.js error:", data),
                  });

                  // Wait for server to be ready
                  console.log("Waiting for server to be ready...");
                  await new Promise((resolve) => setTimeout(resolve, 10000));

                  console.log("File creation completed successfully");
                  return updatedFiles;
                } catch (e) {
                  console.error("Error creating files - Full error:", e);
                  console.error(
                    "Error message:",
                    e instanceof Error ? e.message : String(e)
                  );
                  console.error(
                    "Error stack:",
                    e instanceof Error ? e.stack : "No stack trace"
                  );
                  return {
                    error: `File creation failed: ${
                      e instanceof Error ? e.message : String(e)
                    }`,
                  };
                }
              }
            );
            if (
              typeof newFiles === "object" &&
              newFiles !== null &&
              !newFiles.error
            ) {
              network.state.data.files = newFiles;
              console.log(
                "Updated network state files:",
                Object.keys(newFiles)
              );
            } else {
              console.error("File creation failed:", newFiles);
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error " + e;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssisstantTextMessageText =
            lastAssisstantTextMessageContent(result);

          console.log("📝 onResponse lifecycle hook called");
          console.log("Last assistant message:", lastAssisstantTextMessageText);

          if (lastAssisstantTextMessageText && network) {
            if (lastAssisstantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssisstantTextMessageText;
              console.log("✅ Task summary found and set!");
            } else {
              console.log("❌ No <task_summary> found in assistant message");
            }
          } else {
            console.log("❌ No assistant message or network found");
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    console.log("🤖 Starting AI agent network execution...");
    const result = await network.run(event.data.value, { state });

    console.log("🎯 AI Agent execution completed!");
    console.log(
      "Result state:",
      JSON.stringify(
        {
          summary: result.state.data.summary,
          filesCount: Object.keys(result.state.data.files || {}).length,
          filesList: Object.keys(result.state.data.files || {}),
        },
        null,
        2
      )
    );

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

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary
    );

    const hasFiles =
      result.state.data.files &&
      Object.keys(result.state.data.files).length > 0;
    const isActualError = !result.state.data.summary && !hasFiles;

    console.log("📊 Final result analysis:");
    console.log("- Has summary:", !!result.state.data.summary);
    console.log("- Has files:", hasFiles);
    console.log(
      "- Files count:",
      Object.keys(result.state.data.files || {}).length
    );
    console.log("- Is actual error:", isActualError);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isActualError) {
        // Provide more specific error information for debugging
        console.log("❌ AI Agent Error: No task summary AND no files created");
        console.log("Agent State:", JSON.stringify(result.state.data, null, 2));
        console.log("Network result:", JSON.stringify(result, null, 2));

        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              "The AI agent didn't complete the task properly. This usually happens when the agent doesn't follow the required response format. Please try again with a clear, specific request.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      console.log("✅ AI Agent completed successfully!");
      console.log("Files to save:", Object.keys(result.state.data.files || {}));
      console.log("Sandbox URL:", sandboxUrl);

      // Generate fallback content if no summary provided
      let finalContent = parseAgentOutput(responseOutput);
      let finalTitle = parseAgentOutput(fragmentTitleOutput);

      if (!result.state.data.summary && hasFiles) {
        console.log(
          "⚠️  No task summary provided, but files were created. Using fallback."
        );
        finalContent =
          "I've created your application with the requested functionality. The app has been successfully generated and is ready to use.";
        finalTitle = "Generated App";
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: finalContent,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: finalTitle,
              files: result.state.data.files || {},
            },
          },
        },
      });
    });
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
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
