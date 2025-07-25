import { ProjectView } from "@/module/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  params: Promise<{
    projectId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  try {
    const { projectId } = await params;

    const queryClient = getQueryClient();

    // Prefetch data with error handling
    try {
      await queryClient.prefetchQuery(
        trpc.messages.getMany.queryOptions({ projectId })
      );
      await queryClient.prefetchQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
      );
    } catch (error) {
      console.warn("Failed to prefetch data:", error);
    }

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<div className="p-4">Something went wrong!</div>}
        >
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <ProjectView projectId={projectId} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    );
  } catch (error) {
    console.error("Error in project page:", error);
    return <div className="p-4">Error loading project</div>;
  }
};

export default Page;
