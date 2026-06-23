"use client";

import SignupForm from "@/features/auth/components/SignupForm";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-card border border-border">
      <h1 className="font-heading text-2xl font-bold text-dark mb-2 text-center">Create Account</h1>
      <p className="text-paragraph text-sm text-center mb-8">Join Time Space & Planets today</p>
      <SignupForm
        onSuccess={() => {
          router.push("/");
          router.refresh();
        }}
        onSwitchToLogin={() => router.push("/login")}
      />
    </div>
  );
}
