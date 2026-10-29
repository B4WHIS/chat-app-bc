import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

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
      const data = notification?.request?.content?.data;
      const incomingConvId = data?.conversationId as string | undefined;

      // Nếu đang mở đúng phòng chat của người gửi tin nhắn này -> không hiện banner
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

      // Còn lại: đang ở trong app (màn hình khác, hoặc đang chat với người khác) -> hiện thông báo đầy đủ
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
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
    // 1. Kiểm tra quyền hiện tại
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Nếu chưa có quyền, yêu cầu người dùng cấp quyền
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Không được cấp quyền nhận thông báo Push Notification!");
      return null;
    }

    // 3. Cấu hình Notification Channel cho Android (bắt buộc từ Android 8.0+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Thông báo tin nhắn",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2D6A4F",
        sound: "default",
      });
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
      // Sử dụng mode: 'no-cors' kết hợp Content-Type: 'text/plain' để trình duyệt gửi request trực tiếp mà không bị chặn CORS.
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
    return response.ok && !result.errors;
  } catch (error) {
    console.warn("Lỗi gọi Expo Push API:", error);
    return false;
  }
};
