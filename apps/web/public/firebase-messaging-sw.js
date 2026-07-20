/**
 * Firebase Messaging Service Worker
 *
 * This file MUST live at the web root (/public) so the browser can register it
 * at the correct scope. Firebase SDK requires this for background push handling.
 *
 * The Firebase config is injected via a query string parameter when the
 * service worker is registered (see useFcmToken.ts).
 */

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

// Firebase config hardcoded to avoid evaluation errors if loaded without query params
const firebaseConfig = {
  apiKey: "AIzaSyAGu-_RsRa2x17QOTJzVFYxAd3Up8QUHgY",
  authDomain: "time-space-planet.firebaseapp.com",
  projectId: "time-space-planet",
  storageBucket: "time-space-planet.firebasestorage.app",
  messagingSenderId: "372092763486",
  appId: "1:372092763486:web:242051a838fb71c80a63cf",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when the app tab is not focused)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New Notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    data: payload.data,
  };

  self.registration.showNotification(title, options);
});

// Handle notification click — navigate to the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link || "/astrologer/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's already an open tab, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(link);
          return;
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    }),
  );
});
