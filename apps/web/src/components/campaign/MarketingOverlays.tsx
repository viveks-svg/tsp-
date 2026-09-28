"use client";

import { usePathname } from "next/navigation";
import { PromoPopup } from "./PromoPopup";
import { QuickContactPopup } from "./QuickContactPopup";

/** Marketing popups belong to the public site — never over the admin or astrologer panels. */
export default function MarketingOverlays() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/astrologer")) return null;
  return (
    <>
      <PromoPopup />
      <QuickContactPopup />
    </>
  );
}
