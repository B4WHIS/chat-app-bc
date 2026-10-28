import { AppState, AppStateStatus } from "react-native";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Cập nhật trạng thái trực tuyến (isOnline) và thời điểm hoạt động cuối (lastSeen)
 * của người dùng vào Firestore collection 'users'.
 */
export const setUserOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  if (!userId) return;

  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Lỗi cập nhật trạng thái presence:", error);
  }
};

/**
 * Lắng nghe vòng đời ứng dụng (AppState) và tự động cập nhật
 * isOnline: true khi mở app (active), và isOnline: false khi ẩn/đóng app (background/inactive).
 * 
 * @param userId ID của người dùng hiện tại
 * @returns Hàm unsubscribe để hủy lắng nghe và set offline khi logout/unmount
 */
export const setupPresence = (userId: string): (() => void) => {
  if (!userId) return () => {};

  // Ngay khi khởi động và user đã đăng nhập, đánh dấu online
  setUserOnlineStatus(userId, true);

  let currentAppState: AppStateStatus = AppState.currentState;

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      currentAppState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // Ứng dụng quay trở lại foreground
      setUserOnlineStatus(userId, true);
    } else if (
      currentAppState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      // Ứng dụng bị đưa xuống background hoặc đóng
      setUserOnlineStatus(userId, false);
    }
    currentAppState = nextAppState;
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  return () => {
    // Gỡ bỏ listener và chuyển trạng thái về offline khi unmount / đăng xuất
    subscription.remove();
    setUserOnlineStatus(userId, false);
  };
};

export interface UserPresenceState {
  isOnline: boolean;
  lastSeen?: any;
}

/**
 * Lắng nghe trạng thái Online/Offline và lastSeen của một người dùng theo thời gian thực (Real-time).
 * Phục vụ hiển thị chấm xanh và trạng thái hoạt động ở ChatRoomScreen hoặc danh bạ.
 */
export const subscribeUserPresence = (
  userId: string,
  onUpdate: (presence: UserPresenceState) => void
): (() => void) => {
  if (!userId) {
    onUpdate({ isOnline: false });
    return () => {};
  }

  const userDocRef = doc(db, "users", userId);
  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          isOnline: Boolean(data?.isOnline),
          lastSeen: data?.lastSeen,
        });
      } else {
        onUpdate({ isOnline: false });
      }
    },
    (error) => {
      console.warn(`Lỗi lắng nghe presence của user ${userId}:`, error);
    }
  );

  return unsubscribe;
};

/**
 * Định dạng thời điểm lastSeen thành văn bản tiếng Việt thân thiện
 * ví dụ: "Vừa mới truy cập", "Hoạt động 5 phút trước", "Hoạt động hôm nay lúc 14:30"
 */
export const formatLastSeen = (lastSeen: any): string => {
  if (!lastSeen) return "Ngoại tuyến";

  let date: Date | null = null;
  if (lastSeen instanceof Date) {
    date = lastSeen;
  } else if (typeof lastSeen === "object" && typeof lastSeen.toDate === "function") {
    date = lastSeen.toDate();
  } else if (typeof lastSeen === "object" && typeof lastSeen.toMillis === "function") {
    date = new Date(lastSeen.toMillis());
  } else if (typeof lastSeen === "string" || typeof lastSeen === "number") {
    date = new Date(lastSeen);
  }

  if (!date || isNaN(date.getTime())) {
    return "Ngoại tuyến";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Vừa mới truy cập";
  if (diffMins < 60) return `Hoạt động ${diffMins} phút trước`;
  if (diffHours < 24) {
    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `Hoạt động hôm nay lúc ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `Hoạt động ngày ${dateStr}`;
};
