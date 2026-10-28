import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  Auth,
} from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Initialize Firebase App (tránh lỗi duplicate app khi Fast Refresh / hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Tạo Persistence Adapter cho Firebase Auth sử dụng AsyncStorage.
 * Giúp lưu phiên đăng nhập vĩnh viễn trên thiết bị di động, không bị văng khi reload app.
 */
const createReactNativePersistence = (storage: typeof AsyncStorage) => {
  const STORAGE_AVAILABLE_KEY = "__FIREBASE_STORAGE_TEST__";

  class ReactNativePersistence {
    type = "LOCAL";
    static type = "LOCAL";

    async _isAvailable(): Promise<boolean> {
      try {
        if (!storage) return false;
        await storage.setItem(STORAGE_AVAILABLE_KEY, "1");
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown): Promise<void> {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get(key: string): Promise<unknown> {
      const json = await storage.getItem(key);
      return json ? JSON.parse(json) : null;
    }

    _remove(key: string): Promise<void> {
      return storage.removeItem(key);
    }

    _addListener(): void {
      // Listeners không cần thiết cho native storage
    }

    _removeListener(): void {
      // Listeners không cần thiết cho native storage
    }
  }

  (ReactNativePersistence as any).type = "LOCAL";
  return ReactNativePersistence as any;
};

// Khởi tạo Firebase Auth kèm AsyncStorage Persistence
let authInstance: Auth;
try {
  const persistence =
    typeof (FirebaseAuth as any).getReactNativePersistence === "function"
      ? (FirebaseAuth as any).getReactNativePersistence(AsyncStorage)
      : createReactNativePersistence(AsyncStorage);

  authInstance = initializeAuth(app, {
    persistence,
  });
} catch {
  // Fallback nếu auth đã được khởi tạo trong phiên hiện tại
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
