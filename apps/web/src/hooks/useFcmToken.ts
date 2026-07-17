"use client";

import { useEffect, useRef, useState } from "react";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase/client";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

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

  useEffect(() => {
    if (registered.current) return;

    let unsubscribe: (() => void) | undefined;

    const register = async () => {
      try {
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }

        const fcmToken = await requestFcmToken();
        if (!fcmToken) return;

        setToken(fcmToken);
        registered.current = true;

        // Send the token to our backend
        await apiClient.post(ENDPOINTS.USERS.FCM_TOKEN, { token: fcmToken });

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
        console.error("[useFcmToken] Registration failed:", err);
      }
    };

    void register();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return token;
}
