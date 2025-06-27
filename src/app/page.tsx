import { prisma } from "@/lib/db";

const Page = async () => {
  const users = await prisma.author.findMany();

  return <div className="justify-center">{JSON.stringify(users, null, 2)}</div>;
};

export default Page;
