import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { auth } from "../config/firebase";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { setupPresence } from "../services/presenceService";
import {
  registerForPushNotificationsAsync,
  updateUserPushToken,
} from "../services/notificationService";
import { MainStackParamList } from "../types";

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

const RootNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Lắng nghe trạng thái đăng nhập & đăng ký Push Notifications (TASK-B4.1)
  useEffect(() => {
    let cleanupPresence: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser?.uid) {
        // Kích hoạt hệ thống trạng thái trực tuyến (TASK-C3.1)
        if (cleanupPresence) {
          cleanupPresence();
        }
        cleanupPresence = setupPresence(currentUser.uid);

        // Đăng ký Push Notification và cập nhật pushToken vào Firestore (TASK-B4.1)
        if (Platform.OS !== "web") {
          registerForPushNotificationsAsync().then((token) => {
            if (token && currentUser.uid) {
              updateUserPushToken(currentUser.uid, token);
            }
          });
        }
      } else {
        if (cleanupPresence) {
          cleanupPresence();
          cleanupPresence = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, []);

  // Xử lý Deep-link mở phòng chat khi người dùng nhấn vào thông báo (TASK-B4.2)
  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleNotificationData = (data: Record<string, unknown> | undefined) => {
      if (data?.conversationId && navigationRef.isReady()) {
        navigationRef.navigate("ChatRoom", {
          conversationId: data.conversationId as string,
          partnerId: (data.partnerId as string) || undefined,
          partnerName: (data.partnerName as string) || undefined,
          partnerAvatar: (data.partnerAvatar as string) || undefined,
        });
      }
    };

    // Khi app đang chạy ngầm hoặc đang mở
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        handleNotificationData(data);
      });

    // Khi app được mở từ trạng thái tắt hẳn (Cold Start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response?.notification?.request?.content?.data;
        handleNotificationData(data);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({});

export default RootNavigator;
