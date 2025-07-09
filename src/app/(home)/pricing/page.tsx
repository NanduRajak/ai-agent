"use client";

import { useCurrentTheme } from "@/hooks/use-current-theme";
import { PricingTable } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const Page = () => {
  const currentTheme = useCurrentTheme();
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <h1 className="text-4xl font-bold ">Pricing</h1>
        <p className="text-muted-foreground text-center text-l md:text-base">
          Choose the plan!
        </p>
        <PricingTable
          appearance={{
            baseTheme: currentTheme === "dark" ? dark : undefined,
            elements: {
              pricingTableCard: "border! shadow-none! rounded-lg!",
            },
          }}
        />
      </section>
    </div>
  );
};
export default Page;
