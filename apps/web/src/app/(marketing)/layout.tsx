import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/features/auth/components/AuthModal";
import CartProvider from "@/providers/CartProvider";
import SharedCartDrawer from "@/components/layout/SharedCartDrawer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* <TopBar /> */}
      <Navbar />
      <CartProvider>
        <main>{children}</main>
        <SharedCartDrawer />
      </CartProvider>
      <Footer />
      <AuthModal />
    </>
  );
}
