import { ChatHistorySidebar } from "@/module/home/ui/components/chat-history-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(transparent_1px)] [background-size:16px_16px]" />
      <ChatHistorySidebar>{children}</ChatHistorySidebar>
    </div>
  );
};

export default Layout;
