"use client";

import { useEffect, useRef, useState } from "react";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase/client";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Hook that registers an FCM push token for the current user.
 *
 * - Registers the Firebase service worker with config injected via query params.
 * - Requests browser notification permission.
 * - Retrieves the FCM device token.
 * - Sends it to the backend `POST /users/fcm-token`.
 * - Sets up a foreground message listener that shows a native notification.
 *
 * Only runs once per mount. Safe to call on every render — it no-ops after
 * the first successful registration.
 */
export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const registered = useRef(false);
  const attemptCount = useRef(0);

  useEffect(() => {
    if (registered.current) return;

    let unsubscribe: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout>;

    const register = async () => {
      try {
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }

        const fcmToken = await requestFcmToken();
        if (!fcmToken) {
          // Don't retry — either permission denied or not supported
          console.log("[useFcmToken] Could not retrieve FCM token (permission not granted or not supported)");
          return;
        }

        setToken(fcmToken);

        // Send the token to our backend API (with retry for dev startup race)
        try {
          const response = await apiClient.post<{ success: boolean; message: string }>(
            ENDPOINTS.USERS.FCM_TOKEN,
            { token: fcmToken }
          );

          registered.current = true;
          attemptCount.current = 0;
          console.log("[useFcmToken] FCM token successfully registered on backend:", response);
        } catch (backendErr: any) {
          const msg = backendErr?.message || "";
          const isTransient = msg.includes("500") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed");

          if (isTransient && attemptCount.current < MAX_RETRIES) {
            attemptCount.current += 1;
            const delay = RETRY_DELAY_MS * attemptCount.current;
            console.log(`[useFcmToken] Backend not ready, retrying in ${delay}ms (attempt ${attemptCount.current}/${MAX_RETRIES})`);
            retryTimer = setTimeout(register, delay);
            return;
          }

          console.error("[useFcmToken] Failed to register token on backend:", backendErr);
        }

        // Listen for foreground messages and show a browser notification
        unsubscribe = onForegroundMessage((payload) => {
          if (Notification.permission === "granted") {
            new Notification(payload.notification?.title || "TSP Notification", {
              body: payload.notification?.body || "",
              icon: "/images/logo.png",
            });
          }
        }) as unknown as () => void;
      } catch (err) {
        // This catches FCM getToken errors — log once, don't spam
        console.warn("[useFcmToken] FCM registration unavailable (this is normal in dev without valid Firebase credentials)");
      }
    };

    void register();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimer!) clearTimeout(retryTimer);
    };
  }, []);

  return token;
}

