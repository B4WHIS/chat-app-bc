import { db, auth } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { IUser } from "../types";

/**
 * Tìm kiếm người dùng thật từ collection 'users' trên Cloud Firestore
 */
export const searchUsers = async (keyword: string): Promise<IUser[]> => {
  const currentUid = auth.currentUser?.uid;
  const term = keyword.trim().toLowerCase();
  if (!term) return [];

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(50));
    const snapshot = await getDocs(q);

    const firestoreUsers: IUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as IUser;
      if (docSnap.id !== currentUid && data.id !== currentUid) {
        firestoreUsers.push({
          ...data,
          id: docSnap.id,
        });
      }
    });

    // Lọc theo email hoặc tên hiển thị
    return firestoreUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.displayName?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.warn("Lỗi tìm kiếm users Firestore:", error);
    return [];
  }
};

/**
 * Lấy danh sách bạn bè gợi ý từ Firestore (người dùng thật, loại trừ tài khoản hiện tại)
 */
export const getSuggestedUsers = async (): Promise<IUser[]> => {
  const currentUid = auth.currentUser?.uid;
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(20));
    const snapshot = await getDocs(q);

    const list: IUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as IUser;
      if (docSnap.id !== currentUid && data.id !== currentUid) {
        list.push({ ...data, id: docSnap.id });
      }
    });

    return list;
  } catch (err) {
    console.warn("Lỗi lấy danh sách users Firestore:", err);
    return [];
  }
};

/**
 * Lắng nghe danh sách người dùng theo thời gian thực (Real-time Presence System)
 * Tự động cập nhật isOnline khi user khác mở/đóng app
 */
export const subscribeSuggestedUsers = (
  onUpdate: (users: IUser[]) => void
): (() => void) => {
  const currentUid = auth.currentUser?.uid;
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: IUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as IUser;
          if (docSnap.id !== currentUid && data.id !== currentUid) {
            list.push({ ...data, id: docSnap.id });
          }
        });
        onUpdate(list);
      },
      (err) => {
        console.warn("Lỗi lắng nghe danh sách users Firestore:", err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Exception subscribeSuggestedUsers:", err);
    return () => {};
  }
};

/**
 * Lấy thông tin chi tiết của người dùng từ collection 'users'
 */
export const getUserProfile = async (uid: string): Promise<IUser | null> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { ...(userDocSnap.data() as IUser), id: userDocSnap.id };
    }
    return null;
  } catch (error) {
    console.warn("Lỗi lấy thông tin user profile:", error);
    return null;
  }
};

/**
 * Cập nhật avatar của người dùng:
 * 1. Cập nhật photoURL trong Firebase Auth
 * 2. Cập nhật avatarUrl trong Firestore doc 'users/{uid}'
 */
export const updateUserAvatar = async (uid: string, photoURL: string): Promise<void> => {
  try {
    // 1. Cập nhật Firebase Auth nếu đang là currentUser
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await updateProfile(auth.currentUser, { photoURL });
    }

    // 2. Cập nhật Firestore document 'users/{uid}'
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      avatarUrl: photoURL,
    });
  } catch (error) {
    console.error("Lỗi cập nhật avatar:", error);
    throw error;
  }
};
