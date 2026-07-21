import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBa-5-YFVF7HIn4IqP6J9w1CJAZy9cUofg",
  authDomain: "time-space-planet.firebaseapp.com",
  projectId: "time-space-planet",
  storageBucket: "time-space-planet.firebasestorage.app",
  messagingSenderId: "865105237106",
  appId: "1:865105237106:web:8e64422e50d0f360889eeb",
  measurementId: "G-758WW2LC3L"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
