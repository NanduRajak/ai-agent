import { Param } from "@/generated/prisma/runtime/library";

interface Props {
  params: Promise<{
    projectId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { projectId } = await params;
  return <div>project id:{projectId}</div>;
};

export default Page;
