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
 * Có thêm nhịp tim (Heartbeat) định kỳ 60s để duy trì lastSeen khi người dùng vẫn đang mở app.
 * 
 * @param userId ID của người dùng hiện tại
 * @returns Hàm unsubscribe để hủy lắng nghe và set offline khi logout/unmount
 */
export const setupPresence = (userId: string): (() => void) => {
  if (!userId) return () => {};

  // Ngay khi khởi động và user đã đăng nhập, đánh dấu online
  setUserOnlineStatus(userId, true);

  let currentAppState: string = AppState.currentState || "active";
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const startHeartbeat = () => {
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        setUserOnlineStatus(userId, true);
      }, 60000);
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  startHeartbeat();

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      currentAppState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // Ứng dụng quay trở lại foreground
      setUserOnlineStatus(userId, true);
      startHeartbeat();
    } else if (
      currentAppState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      // Ứng dụng bị đưa xuống background hoặc người dùng khóa màn hình
      stopHeartbeat();
      setUserOnlineStatus(userId, false);
    }
    currentAppState = nextAppState;
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  // Trả về cleanup callback: hủy lắng nghe và đánh dấu offline
  return () => {
    stopHeartbeat();
    subscription.remove();
    setUserOnlineStatus(userId, false);
  };
};

/**
 * Lắng nghe thời gian thực trạng thái trực tuyến của 1 user cụ thể
 * Phục vụ hiển thị chấm xanh "Online" / "Hoạt động ... trước" trên ChatHeader
 * 
 * @param targetUserId ID người cần theo dõi trạng thái
 * @param onUpdate Callback trả về { isOnline, lastSeen }
 * @returns Hàm unsubscribe
 */
export const subscribeUserPresence = (
  targetUserId: string,
  onUpdate: (presence: { isOnline: boolean; lastSeen?: any }) => void
): (() => void) => {
  if (!targetUserId) return () => {};

  const userDocRef = doc(db, "users", targetUserId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          isOnline: isUserCurrentlyOnline(data?.isOnline, data?.lastSeen),
          lastSeen: data?.lastSeen,
        });
      } else {
        onUpdate({ isOnline: false });
      }
    },
    (error) => {
      console.warn("Lỗi subscribeUserPresence:", error);
    }
  );

  return unsubscribe;
};

/**
 * Kiểm tra xem người dùng có thực sự đang trực tuyến hay không.
 * Điều kiện: isOnline === true VÀ lastSeen cách hiện tại không quá timeoutSeconds (mặc định 180s = 3 phút).
 */
export const isUserCurrentlyOnline = (
  isOnline: boolean | undefined,
  lastSeen: any,
  timeoutSeconds: number = 180
): boolean => {
  if (!isOnline) return false;
  if (!lastSeen) return false;

  let date: Date;
  if (lastSeen.toDate && typeof lastSeen.toDate === "function") {
    date = lastSeen.toDate();
  } else if (lastSeen instanceof Date) {
    date = lastSeen;
  } else if (typeof lastSeen === "string" || typeof lastSeen === "number") {
    date = new Date(lastSeen);
  } else {
    return false;
  }

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  return diffInSeconds >= 0 && diffInSeconds <= timeoutSeconds;
};

/**
 * Helper format hiển thị thời gian hoạt động cuối (lastSeen) thân thiện
 * Ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước", "Hôm qua lúc 14:30"
 */
export const formatLastSeen = (lastSeen: any): string => {
  if (!lastSeen) return "Chưa hoạt động gần đây";

  let date: Date;
  if (lastSeen.toDate && typeof lastSeen.toDate === "function") {
    date = lastSeen.toDate();
  } else if (lastSeen instanceof Date) {
    date = lastSeen;
  } else if (typeof lastSeen === "string" || typeof lastSeen === "number") {
    date = new Date(lastSeen);
  } else {
    return "Chưa hoạt động gần đây";
  }

  if (Number.isNaN(date.getTime())) {
    return "Chưa hoạt động gần đây";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa mới truy cập";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Hôm qua";
  }
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};
