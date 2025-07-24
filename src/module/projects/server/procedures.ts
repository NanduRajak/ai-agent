import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Helper function to generate meaningful project title from user input
function generateProjectTitle(userInput: string): string {
  // Extract key words from the user input to create a meaningful title
  const cleanInput = userInput.toLowerCase().trim();

  // Remove common words and keep meaningful ones
  const stopWords = [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "i",
    "want",
    "to",
    "build",
    "create",
    "make",
    "can",
    "you",
    "please",
    "help",
    "me",
  ];

  const words = cleanInput
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 3); // Take first 3 meaningful words

  if (words.length === 0) {
    return "New Project";
  }

  // Capitalize first letter of each word
  const title = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return title.length > 30 ? title.substring(0, 30) + "..." : title;
}

export const projectsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Id is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });
      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      return existingProject;
    }),

  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        updatedAT: "desc",
      },
    });

    return projects;
  }),
  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Message is required" })
          .max(10000, { message: "Value is too long..." }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: generateProjectTitle(input.value),
          message: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });
      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: createdProject.id,
        },
      });
      return createdProject;
    }),

  updateFiles: protectedProcedure
    .input(
      z.object({
        fragmentId: z.string().min(1, { message: "Fragment ID is required" }),
        files: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // First, verify the fragment belongs to a project owned by the user
      const fragment = await prisma.fragment.findUnique({
        where: {
          id: input.fragmentId,
        },
        include: {
          message: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!fragment || fragment.message.project.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fragment not found or access denied.",
        });
      }

      // Update the fragment with new files
      const updatedFragment = await prisma.fragment.update({
        where: {
          id: input.fragmentId,
        },
        data: {
          files: input.files,
          updatedAt: new Date(),
        },
      });

      // Trigger a job to update the sandbox files
      await inngest.send({
        name: "sandbox/update-files",
        data: {
          sandboxUrl: fragment.sandboxUrl,
          files: input.files,
        },
      });

      return updatedFragment;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // First, verify the project belongs to the user
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied.",
        });
      }

      // Delete the project (cascade will handle related messages and fragments)
      await prisma.project.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
