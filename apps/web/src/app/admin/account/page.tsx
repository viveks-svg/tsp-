"use client";

import { PageHeader } from "@/features/admin/components/primitives";
import StaffSecurity from "@/features/auth/components/StaffSecurity";
import { useAuth } from "@/providers/AuthProvider";

/** Your own sign-in: two-step verification and password. Every team member has this page. */
export default function MyAccountPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-[1000px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="The House" title="My account" description={`Signed in as ${user?.email ?? user?.name ?? ""}. Keep your sign-in secure.`} />
      <StaffSecurity />
    </div>
  );
}
