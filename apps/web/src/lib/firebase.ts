import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAGu-_RsRa2x17QOTJzVFYxAd3Up8QUHgY",
  authDomain: "time-space-planets.firebaseapp.com",
  projectId: "time-space-planets",
  storageBucket: "time-space-planets.firebasestorage.app",
  messagingSenderId: "372092763486",
  appId: "1:372092763486:web:242051a838fb71c80a63cf",
  measurementId: "G-XV3B73DS02",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
