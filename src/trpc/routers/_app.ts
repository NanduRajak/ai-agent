import { projectsRouter } from "@/module/projects/server/procedures";
import { createTRPCRouter } from "../init";
import { messagesRouter } from "@/module/message/server/procedures";
export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
