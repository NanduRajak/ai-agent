import Link from "next/link";
import Image from "next/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HomeIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

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
        <div className="relative">
          <Image src="/logo.svg" alt="Vibe" width={18} height={18} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-75"></div>
        </div>
        <span className="text-sm font-medium">{project.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-accent transition-colors group"
        >
          <Link href="/" className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
            <span>Home</span>
          </Link>
        </Button>
      </div>
    </header>
  );
};
