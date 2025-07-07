import { ProjectForm } from "@/module/home/ui/components/project-fom";
import { ProjectsList } from "@/module/home/ui/components/project-list";
import Image from "next/image";

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="logo.svg"
            alt="Vibe"
            width={50}
            height={50}
            className="hidden md:block"
          />
          <h1 className="text-2xl md:text-5xl text-muted-foreground text-center">
            Building something With AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center">
            Create apps and websites by chatting with AI
          </p>
          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm />
          </div>
        </div>
      </section>
      <ProjectsList />
    </div>
  );
};

export default Page;
