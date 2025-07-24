"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesConatiner } from "../components/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon } from "lucide-react";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  const trpc = useTRPC();

  const updateFiles = useMutation(
    trpc.projects.updateFiles.mutationOptions({
      onSuccess: () => {
        toast.success("Files updated successfully");
      },
      onError: (error) => {
        toast.error("Failed to update files: " + error.message);
      },
    })
  );

  const handleFilesUpdate = async (updatedFiles: {
    [path: string]: string;
  }) => {
    if (activeFragment) {
      await updateFiles.mutateAsync({
        fragmentId: activeFragment.id,
        files: updatedFiles,
      });

      // Update the local state immediately for better UX
      setActiveFragment({
        ...activeFragment,
        files: updatedFiles,
      });
    }
  };
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <ErrorBoundary fallback={<p>Project header</p>}>
            <Suspense fallback={<p>Loading projects...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<p>Messages container error...</p>}>
            <Suspense fallback={<p>Loading messages...</p>}>
              <MessagesConatiner
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment?.files && (
                <FileExplorer
                  files={activeFragment.files as { [path: string]: string }}
                  onFilesUpdate={handleFilesUpdate}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
