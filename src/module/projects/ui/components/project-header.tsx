import Link from "next/link";
import Image from "next/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({ id: projectId })
  );

  return (
    <header className="p-2 flex justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Vibe" width={18} height={18} />
        <span className="text-sm font-medium">{project.name}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        asChild
        className="hover:bg-accent transition-colors"
      >
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </Button>
    </header>
  );
};
