"use client";

import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@/types/user";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Logo and Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex justify-center mb-4">
          <Image
            src="/logo/Group 2.svg"
            alt="TSP Logo"
            width={70}
            height={70}
            className="w-16 h-16 hover:scale-105 transition-transform duration-300"
            priority
          />
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Connect with India&apos;s best astrologers on Time Space &amp; Planets
        </p>
      </div>

      {/* Login Form Component */}
      <LoginForm
        onSuccess={(user: User) => {
          const role = user?.role;

          if (role === "ASTROLOGER") {
            router.push("/astrologer/dashboard");
          } else if (role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/");
          }

          router.refresh();
        }}
        onSwitchToSignup={() => router.push("/signup")}
      />

      {/* Footer Info */}
      <p className="text-center text-xs text-slate-400">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-slate-600">
          Terms of Service
        </Link>
        <Link href="/privacy-policy" className="underline hover:text-slate-600">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
