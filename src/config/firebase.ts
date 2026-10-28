import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI7XXjV79_GPWJ7j7nGI01cQKzAhbj58w",
  authDomain: "chat-app-bc-e2d4c.firebaseapp.com",
  projectId: "chat-app-bc-e2d4c",
  storageBucket: "chat-app-bc-e2d4c.firebasestorage.app",
  messagingSenderId: "236353674890",
  appId: "1:236353674890:web:1e4e921197759224e0d773",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
