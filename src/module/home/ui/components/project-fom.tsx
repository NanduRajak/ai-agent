"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { z } from "zod";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(10000, { message: "Prompt is too long..." }),
});

export const ProjectForm = () => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
        if (error?.data?.code === "UNAUTHORIZED") {
          router.push("/sign-in");
        }
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
    });
  };

  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative enhanced-border p-4 rounded-2xl transition-all duration-300 glass-blur",
            "hover:shadow-lg hover:scale-[1.005]",
            "max-w-2xl mx-auto", // Reduced max width
            isFocused && "enhanced-border-focus"
          )}
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutosize
                {...field}
                disabled={isPending}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                minRows={2}
                maxRows={4}
                className={cn(
                  "pt-2 pb-2 resize-none border-none w-full outline-none bg-transparent text-base transition-all duration-200",
                  "placeholder:text-muted-foreground/50 focus:placeholder:text-muted-foreground/30"
                )}
                placeholder="What would you like to build?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
              />
            )}
          />

          <div className="flex gap-x-3 items-end justify-between pt-2">
            <div className="text-[10px] text-muted-foreground font-mono opacity-70 transition-opacity duration-200 hover:opacity-100">
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp; to submit
            </div>
            <Button
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full transition-all duration-200 smooth-transform",
                isButtonDisabled
                  ? "bg-muted-foreground/30 border hover:scale-100"
                  : "hover:scale-110 shadow-lg hover:shadow-xl"
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </Button>
          </div>
        </form>
      </section>
    </Form>
  );
};
