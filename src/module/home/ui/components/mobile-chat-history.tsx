"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
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
import { useState } from "react";
import { motion } from "framer-motion";

export const MobileChatHistory = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());

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
    <div className="mt-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Chat
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {projects?.length === 0 && (
          <div className="p-6 text-center">
            <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Start a new chat to see it here
            </p>
          </div>
        )}
        {projects?.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative"
          >
            <Link
              href={`/projects/${project.id}`}
              className="block p-4 rounded-xl bg-background/60 hover:bg-accent/80 border border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquareIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate mb-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(project.updatedAT, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </Link>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    disabled={deletingId === project.id}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &ldquo;{project.name}
                      &rdquo;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(project.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
