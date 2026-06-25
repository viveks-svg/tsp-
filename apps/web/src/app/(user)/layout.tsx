import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/features/auth/components/AuthModal";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* <TopBar /> */}
      <Navbar />
      <main className="min-h-screen bg-cream pt-[125px] lg:pt-[140px]">{children}</main>
      <Footer />
      <AuthModal />
    </>
  );
}
