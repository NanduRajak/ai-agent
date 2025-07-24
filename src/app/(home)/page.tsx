import { ProjectForm } from "@/module/home/ui/components/project-fom";
import Image from "next/image";

const Page = () => {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full h-full">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-12">
        <div className="space-y-8">
          {/* Logo and Title */}
          <div className="space-y-4">
            <div className="relative">
              <Image
                src="/logo.svg"
                alt="Vibe"
                width={64}
                height={64}
                className="mx-auto drop-shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                Building something{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  With AI
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Create apps and websites by chatting with AI. Just describe what
                you want to build, and watch it come to life.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="max-w-2xl mx-auto w-full">
            <ProjectForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
