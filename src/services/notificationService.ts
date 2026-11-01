import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Cấu hình thông báo & âm thanh
 */
export interface INotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_SETTINGS_KEY = "@chat_app_notification_settings";

let currentNotificationSettings: INotificationSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
};

/**
 * Lấy cấu hình thông báo & âm thanh (từ AsyncStorage hoặc bộ nhớ đệm)
 */
export const getNotificationSettings = async (): Promise<INotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (raw) {
      currentNotificationSettings = { ...currentNotificationSettings, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn("Lỗi đọc cài đặt thông báo:", err);
  }
  return currentNotificationSettings;
};

// Khởi chạy đọc cấu hình ngay lập tức
getNotificationSettings();

/**
 * Cập nhật cấu hình thông báo & âm thanh (Lưu cả AsyncStorage và Cloud Firestore)
 */
export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<INotificationSettings>
): Promise<INotificationSettings> => {
  currentNotificationSettings = {
    ...currentNotificationSettings,
    ...settings,
  };

  try {
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(currentNotificationSettings)
    );
  } catch (err) {
    console.warn("Lỗi lưu cài đặt thông báo local:", err);
  }

  if (userId) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        notificationSettings: currentNotificationSettings,
        ...(settings.notificationsEnabled === false ? { pushToken: "" } : {}),
      });

      if (settings.notificationsEnabled === true && Platform.OS !== "web") {
        registerForPushNotificationsAsync().then((token) => {
          if (token && userId) {
            updateUserPushToken(userId, token);
          }
        });
      }
    } catch (err) {
      console.warn("Lỗi lưu cài đặt thông báo Firestore:", err);
    }
  }

  return currentNotificationSettings;
};

/**
 * Lưu trữ ID phòng chat người dùng đang mở trực tiếp để tránh hiện popup đè khi đang đọc chat
 */
let currentActiveConversationId: string | null = null;

export const setCurrentActiveConversationId = (conversationId: string | null): void => {
  currentActiveConversationId = conversationId;
};

export const getCurrentActiveConversationId = (): string | null => {
  return currentActiveConversationId;
};

/**
 * Cấu hình xử lý thông báo khi ứng dụng đang mở (Foreground)
 */
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // 1. Nếu người dùng tắt thông báo trong Cài đặt
      if (!currentNotificationSettings.notificationsEnabled) {
        return {
          shouldShowAlert: false,
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      const data = notification?.request?.content?.data;
      const incomingConvId = data?.conversationId as string | undefined;

      // 2. Nếu đang mở đúng phòng chat của người gửi tin nhắn này -> không hiện banner
      const isCurrentlyViewingThisChat =
        Boolean(currentActiveConversationId) &&
        Boolean(incomingConvId) &&
        currentActiveConversationId === incomingConvId;

      if (isCurrentlyViewingThisChat) {
        return {
          shouldShowAlert: false,
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      // 3. Còn lại: hiện thông báo theo cài đặt âm thanh
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: currentNotificationSettings.soundEnabled,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Đăng ký và lấy Expo Push Token của thiết bị hiện tại
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (Platform.OS === "web" || !Device.isDevice) {
    if (Platform.OS !== "web") {
      console.log("Push notifications chỉ hoạt động trên thiết bị thật (Physical Device).");
    }
    return null;
  }

  try {
    // 1. Cấu hình Notification Channel cho Android (bắt buộc trước khi xin quyền từ Android 13+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Thông báo tin nhắn",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2D6A4F",
        sound: "default",
      });
    }

    // 2. Kiểm tra quyền hiện tại
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 3. Nếu chưa có quyền, yêu cầu người dùng cấp quyền
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Không được cấp quyền nhận thông báo Push Notification!");
      return null;
    }

    // 4. Lấy Expo Push Token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "7e7488e6-5929-4148-8cc1-f5724b0449d2";

    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("=> Lấy Expo Push Token thành công:", pushTokenResponse.data);
    return pushTokenResponse.data;
  } catch (error) {
    console.warn("Lỗi đăng ký Push Notifications:", error);
    return null;
  }
};

/**
 * Lưu Push Token vào tài khoản người dùng trên Firestore collection 'users'
 */
export const updateUserPushToken = async (
  userId: string,
  token: string
): Promise<void> => {
  if (!userId || !token) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token,
      fcmToken: token, // Duy trì đồng bộ cho cả hai trường
    });
    console.log("=> Đã lưu pushToken vào Firestore cho user:", userId);
  } catch (error) {
    console.warn("Lỗi lưu pushToken lên Firestore:", error);
  }
};

/**
 * Gửi thông báo tự động thông qua Expo Push API (exp.host)
 */
export const sendPushNotification = async ({
  pushToken,
  title,
  body,
  data,
}: {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<boolean> => {
  if (!pushToken || typeof pushToken !== "string") {
    return false;
  }

  // Kiểm tra định dạng token hợp lệ của Expo
  if (!pushToken.startsWith("ExponentPushToken") && !pushToken.startsWith("ExpoPushToken")) {
    console.warn("Token không đúng định dạng Expo Push Token:", pushToken);
    return false;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data: data || {},
  };

  try {
    if (Platform.OS === "web") {
      // Trên Web browser, exp.host không có header CORS cho phép domain localhost.
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(message),
      });
      return true;
    }

    // Trên Native (Android / iOS): fetch bình thường
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (!response.ok || result.errors) {
      return false;
    }

    const ticket = result.data;
    if (ticket && typeof ticket === "object" && "status" in ticket) {
      return ticket.status === "ok";
    }

    return true;
  } catch (error) {
    console.warn("Lỗi gọi Expo Push API:", error);
    return false;
  }
};
