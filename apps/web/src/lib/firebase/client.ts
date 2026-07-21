/**
 * Firebase Client SDK — initialized once for the browser.
 *
 * Used exclusively for FCM (push notifications).
 * Auth is handled by our own JWT system, NOT Firebase Auth on the client.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBa-5-YFVF7HIn4IqP6J9w1CJAZy9cUofg",
  authDomain: "time-space-planet.firebaseapp.com",
  projectId: "time-space-planet",
  storageBucket: "time-space-planet.firebasestorage.app",
  messagingSenderId: "865105237106",
  appId: "1:865105237106:web:8e64422e50d0f360889eeb",
  measurementId: "G-758WW2LC3L"
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

/**
 * Get the FCM Messaging instance (browser only).
 * Returns null during SSR or if the browser doesn't support notifications.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  if (!messaging) {
    messaging = getMessaging(getFirebaseApp());
  }
  return messaging;
}

let fcmTokenFailed = false;

/**
 * Request notification permission and retrieve the FCM device token.
 * Returns null if permission is denied or the browser doesn't support it.
 * Caches failures to avoid repeated calls when Firebase is misconfigured.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (fcmTokenFailed) return null; // Don't retry known-failed configs

  const msg = getFirebaseMessaging();
  if (!msg) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BEFAh2AxZ0zzmmOaBlCVMi8D8tDWORnxJWfD6m61hFTKkM6yK5nAwuAsGEcx4qfAuumgCvxbtSfZ4q6k4yZgmBM";
  if (!vapidKey) {
    console.warn("[FCM] VAPID key not configured — cannot get push token.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Notification permission denied.");
      return null;
    }

    const token = await getToken(msg, { vapidKey });
    return token;
  } catch (err: any) {
    // Mark as failed to prevent repeated calls with the same bad config
    fcmTokenFailed = true;
    console.error("[FCM] Failed to get token:", err?.message || err);
    return null;
  }
}

/**
 * Listen for foreground push messages.
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};

  return onMessage(msg, callback);
}
