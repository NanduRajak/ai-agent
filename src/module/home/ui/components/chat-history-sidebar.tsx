"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon, MessageSquareIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type Project } from "@/inngest/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Navbar } from "./navbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHistorySidebarProps {
  children: React.ReactNode;
}

interface ChatListProps {
  projects: Project[] | undefined;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

const ChatHistorySidebarContent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { state, toggleSidebar } = useSidebar();

  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());

  // Add keyboard shortcut for sidebar toggle (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const deleteProject = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        toast.success("Chat deleted successfully");
        setDeletingId(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeletingId(null);
      },
    })
  );

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    await deleteProject.mutateAsync({ id: projectId });
  };

  if (!user) return null;

  return (
    <>
      <SidebarHeader className="px-4 py-4 border-b bg-sidebar/50 backdrop-blur-sm">
        <motion.div
          initial={false}
          animate={{
            opacity: state === "expanded" ? 1 : 0,
            x: state === "expanded" ? 0 : -20,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "flex items-center justify-between",
            state === "collapsed" && "hidden"
          )}
        >
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            Chat History
          </h2>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 px-3 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm transition-all duration-200 fade-in-scale"
          >
            <Link href="/">
              <PlusIcon className="h-3 w-3 mr-2" />
              New
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            opacity: state === "collapsed" ? 1 : 0,
            scale: state === "collapsed" ? 1 : 0.8,
          }}
          transition={{ duration: 0.3, delay: state === "collapsed" ? 0.1 : 0 }}
          className={cn(
            "flex justify-center",
            state === "expanded" && "hidden"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 w-8 p-0 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-all duration-200 fade-in-scale"
            title="New Chat"
          >
            <Link href="/">
              <PlusIcon className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 sidebar-blur">
        <ChatList
          projects={projects}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      </SidebarContent>
    </>
  );
};

export const ChatHistorySidebar = ({ children }: ChatHistorySidebarProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          {/* Desktop Sidebar */}
          <Sidebar
            variant="inset"
            collapsible="icon"
            className="hidden md:flex sidebar-blur border-r border-sidebar-border/50"
          >
            <ChatHistorySidebarContent />
          </Sidebar>

          {/* Main Content */}
          <main className="flex-1 transition-all duration-300 ease-in-out">
            {/* Desktop Header */}
            <div className="hidden md:flex sticky top-0 z-50 h-16 items-center gap-2 px-4 glass-effect border-b border-border/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="transition-all duration-200 hover:bg-accent/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Sidebar (⌘B)</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Vibe AI</span>
              </div>
            </div>

            {/* Mobile Header - Import Navbar */}
            <div className="md:hidden">
              <Navbar />
            </div>

            {/* Content */}
            <div className="p-4 pt-4 md:pt-4">
              <div className="max-w-7xl mx-auto">{children}</div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

// Chat List Component
const ChatList = ({ projects, deletingId, onDelete }: ChatListProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-sidebar-foreground/60" />
              <p className="text-sm text-sidebar-foreground/80">
                No conversations yet
              </p>
              <p className="text-xs text-sidebar-foreground/60 mt-1">
                Start a new chat to see it here
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-center"
            >
              <MessageSquareIcon className="h-6 w-6 text-sidebar-foreground/60" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <SidebarMenu className="space-y-2">
      {projects.map((project: Project, index: number) => (
        <SidebarMenuItem key={project.id}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="group relative"
          >
            <SidebarMenuButton
              asChild
              className={cn(
                "w-full h-auto p-3 chat-item-hover rounded-lg border border-transparent hover:border-sidebar-border/50",
                isCollapsed && "justify-center p-2"
              )}
            >
              <Link href={`/projects/${project.id}`}>
                <div
                  className={cn(
                    "flex-shrink-0 rounded-lg bg-sidebar-primary/10 flex items-center justify-center",
                    isCollapsed ? "w-8 h-8" : "w-7 h-7"
                  )}
                >
                  <MessageSquareIcon
                    className={cn(
                      "text-sidebar-primary",
                      isCollapsed ? "h-4 w-4" : "h-3.5 w-3.5"
                    )}
                  />
                </div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 ml-3"
                    >
                      <h3 className="font-medium text-sm text-sidebar-foreground truncate mb-0.5">
                        {project.name}
                      </h3>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {formatDistanceToNow(project.updatedAT, {
                          addSuffix: true,
                        })}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </SidebarMenuButton>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        disabled={deletingId === project.id}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="backdrop-blur-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{project.name}
                          &quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
