"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  MoreHorizontalIcon,
  Edit3Icon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Project } from "@/inngest/types";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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
import { ThemeToggle } from "@/components/theme-toggle";

interface ChatHistorySidebarProps {
  children: React.ReactNode;
}

interface ChatListProps {
  projects: Project[] | undefined;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

const ChatHistorySidebarContent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useUser();
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
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleDelete = async (projectId: string) => {
    await deleteProject.mutateAsync({ id: projectId });
  };

  const handleRename = async (projectId: string, newName: string) => {
    console.log("Renaming project:", projectId, "to:", newName);
    toast.success("Project renamed");
  };

  if (!user) return null;

  return (
    <>
      <SidebarHeader className="px-4 py-4 border-b-2 border-sidebar-border bg-sidebar/50 backdrop-blur-sm shadow-sm">
        {/* Always show toggle button */}
        <div className="flex items-center gap-3 mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="transition-all duration-200 hover:bg-accent/80 h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Sidebar (⌘B)</p>
            </TooltipContent>
          </Tooltip>
          {state === "expanded" && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              Vibe
            </span>
          )}
        </div>

        {/* New chat button */}
        {state === "expanded" ? (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full h-10 mb-4 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 justify-start"
          >
            <Link href="/">
              <PlusIcon className="h-4 w-4 mr-2" />
              <span>New chat</span>
            </Link>
          </Button>
        ) : (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-10 w-10 p-0 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              title="New Chat"
            >
              <Link href="/">
                <PlusIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Chats header */}
        {state === "expanded" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Chats</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-10 w-10 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-0 py-2 sidebar-blur">
        <ChatList
          projects={projects}
          onDelete={handleDelete}
          onRename={handleRename}
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
            className="hidden md:flex sidebar-blur border-r-2 border-sidebar-border shadow-lg fixed left-0 top-0 z-40 h-full transition-all duration-300"
          >
            <ChatHistorySidebarContent />
          </Sidebar>

          {/* Main Content - Fixed positioning */}
          <main className="flex-1 min-h-screen">
            <div className="fixed top-4 right-4 z-50 hidden md:block">
              <ThemeToggle />
            </div>
            {/* Desktop Layout */}
            <div className="hidden md:block min-h-screen">
              {/* Content - Always centered */}
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-5xl mx-auto">{children}</div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              {/* Mobile Header - Import Navbar */}
              <div>
                <Navbar />
              </div>

              {/* Content */}
              <div className="p-4 pt-4">
                <div className="max-w-7xl mx-auto">{children}</div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

// Chat List Component
const ChatList = ({ projects, onDelete, onRename }: ChatListProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!projects || projects.length === 0) {
    return null;
  }

  const handleRenameSubmit = (projectId: string) => {
    if (editingName.trim()) {
      onRename(projectId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-1 px-2">
      {projects.map((project: Project, index: number) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="group relative"
        >
          <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent/50">
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  {editingId === project.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRenameSubmit(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameSubmit(project.id);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground"
                      autoFocus
                    />
                  ) : (
                    <Link href={`/projects/${project.id}`}>
                      <h3 className="font-medium text-sm text-foreground truncate leading-tight hover:text-foreground/80 transition-colors">
                        {project.name}
                      </h3>
                    </Link>
                  )}
                </div>

                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent"
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-popover border border-border/50 shadow-lg"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(project.id);
                          setEditingName(project.name);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-accent"
                      >
                        <Edit3Icon className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(project.id)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-destructive/10 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
