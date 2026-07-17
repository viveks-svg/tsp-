"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useFcmToken } from "@/hooks/useFcmToken";

function FcmTokenLoader() {
  useFcmToken();
  return null;
}

export function FcmInitializer() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return <FcmTokenLoader />;
}
