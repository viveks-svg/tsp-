import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/features/auth/components/AuthModal";
import { QueueSocketProvider } from "@/providers/QueueSocketProvider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueueSocketProvider>
      {/* <TopBar /> */}
      <Navbar />
      <main className="min-h-screen bg-cream pt-[125px] lg:pt-[140px]">{children}</main>
      <Footer />
      <AuthModal />
    </QueueSocketProvider>
  );
}
