/**
 * Firebase Client SDK — initialized once for the browser.
 *
 * Used exclusively for FCM (push notifications).
 * Auth is handled by our own JWT system, NOT Firebase Auth on the client.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAGu-_RsRa2x17QOTJzVFYxAd3Up8QUHgY",
  authDomain: "time-space-planets.firebaseapp.com",
  projectId: "time-space-planets",
  storageBucket: "time-space-planets.firebasestorage.app",
  messagingSenderId: "372092763486",
  appId: "1:372092763486:web:242051a838fb71c80a63cf",
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

/**
 * Request notification permission and retrieve the FCM device token.
 * Returns null if permission is denied or the browser doesn't support it.
 */
export async function requestFcmToken(): Promise<string | null> {
  const msg = getFirebaseMessaging();
  if (!msg) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BIiiWT2qdp8plswatDrhb8xMNxyI0rsz0rbap37rJ2JldTzrybxxevOhx_s0Qr27YTGGmziVET8NGrH8SXBn0Ds";
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
  } catch (err) {
    console.error("[FCM] Failed to get token:", err);
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
