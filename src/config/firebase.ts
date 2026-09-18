import { getAuth } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
