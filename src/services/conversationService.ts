import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { IConversation, IUser } from "../types";

/**
 * Tạo ID cuộc hội thoại chuẩn hóa [uid1, uid2].sort().join('_') để chống trùng lặp
 */
export const generateConversationId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join("_");
};

/**
 * Lấy hoặc chuẩn bị cuộc trò chuyện (Hỗ trợ Lazy Creation)
 * - Nếu đã tồn tại trên Firestore: Trả về cuộc hội thoại
 * - Nếu chưa có: Tạo đối tượng mẫu trong bộ nhớ, sẵn sàng ghi Firestore khi gửi tin nhắn đầu tiên
 */
export const getOrCreateConversation = async (
  myUser: { id: string; displayName?: string; avatarUrl?: string },
  partnerUser: { id: string; displayName?: string; avatarUrl?: string }
): Promise<{ conversation: IConversation; isNew: boolean }> => {
  const conversationId = generateConversationId(myUser.id, partnerUser.id);
  const convRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(convRef);

  if (convSnap.exists()) {
    return {
      conversation: { id: convSnap.id, ...(convSnap.data() as any) },
      isNew: false,
    };
  }

  // Khởi tạo đối tượng tạm thời (Lazy Create)
  const draftConversation: IConversation = {
    id: conversationId,
    participantIds: [myUser.id, partnerUser.id],
    participantsMap: {
      [myUser.id]: {
        displayName: myUser.displayName || "Bạn",
        avatarUrl: myUser.avatarUrl,
      },
      [partnerUser.id]: {
        displayName: partnerUser.displayName || "Bạn bè",
        avatarUrl: partnerUser.avatarUrl,
      },
    },
    lastMessageText: "",
    lastMessageSenderId: "",
    lastMessageTimestamp: null,
    unreadCount: {
      [myUser.id]: 0,
      [partnerUser.id]: 0,
    },
    pinnedBy: [],
    mutedBy: [],
    updatedAt: new Date().toISOString(),
  };

  return {
    conversation: draftConversation,
    isNew: true,
  };
};

/**
 * Tạo cuộc hội thoại chính thức trên Firestore khi gửi tin nhắn đầu tiên
 */
export const createConversationOnFirstMessage = async (
  myUser: { id: string; displayName?: string; avatarUrl?: string },
  partnerUser: { id: string; displayName?: string; avatarUrl?: string },
  firstMessageText: string
): Promise<IConversation> => {
  const conversationId = generateConversationId(myUser.id, partnerUser.id);
  const convRef = doc(db, "conversations", conversationId);

  const newConversation: IConversation = {
    id: conversationId,
    participantIds: [myUser.id, partnerUser.id],
    participantsMap: {
      [myUser.id]: {
        displayName: myUser.displayName || "Bạn",
        avatarUrl: myUser.avatarUrl,
      },
      [partnerUser.id]: {
        displayName: partnerUser.displayName || "Bạn bè",
        avatarUrl: partnerUser.avatarUrl,
      },
    },
    lastMessageText: firstMessageText,
    lastMessageSenderId: myUser.id,
    lastMessageTimestamp: serverTimestamp(),
    unreadCount: {
      [myUser.id]: 0,
      [partnerUser.id]: 1,
    },
    pinnedBy: [],
    mutedBy: [],
    updatedAt: serverTimestamp(),
  };

  await setDoc(convRef, newConversation, { merge: true });
  return newConversation;
};

/**
 * Lắng nghe danh sách cuộc trò chuyện thời gian thực (Real-time) qua onSnapshot
 * Sắp xếp tin nhắn mới nhất lên đầu (in-memory sort để không bị lỗi thiếu Firestore Index)
 */
export const subscribeConversations = (
  userId: string,
  onUpdate: (conversations: IConversation[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participantIds", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: IConversation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        const getTimestampMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val === "number") return val;
          if (val instanceof Date) return val.getTime();
          if (typeof val === "string") return new Date(val).getTime() || 0;
          if (typeof val === "object" && typeof val.toMillis === "function") {
            return val.toMillis();
          }
          if (typeof val === "object" && typeof val.toDate === "function") {
            return val.toDate().getTime();
          }
          return 0;
        };

        // Sắp xếp theo updatedAt mới nhất lên đầu
        list.sort((a, b) => {
          const timeA = getTimestampMillis(a.updatedAt);
          const timeB = getTimestampMillis(b.updatedAt);
          return timeB - timeA;
        });

        onUpdate(list);
      },
      (error) => {
        console.warn("Lỗi lắng nghe conversations:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn("Exception subscribeConversations:", err);
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Ghim hoặc Bỏ ghim cuộc trò chuyện (Đồng bộ Cloud Firestore)
 */
export const togglePinConversation = async (
  conversationId: string,
  userId: string,
  isCurrentlyPinned: boolean
): Promise<void> => {
  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    pinnedBy: isCurrentlyPinned ? arrayRemove(userId) : arrayUnion(userId),
  });
};

/**
 * Tắt hoặc Bật chuông thông báo (Đồng bộ Cloud Firestore)
 */
export const toggleMuteConversation = async (
  conversationId: string,
  userId: string,
  isCurrentlyMuted: boolean
): Promise<void> => {
  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    mutedBy: isCurrentlyMuted ? arrayRemove(userId) : arrayUnion(userId),
  });
};

/**
 * Đánh dấu đã đọc tin nhắn
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.warn("Lỗi đánh dấu đã đọc:", error);
  }
};

/**
 * Xóa cuộc trò chuyện khỏi Firestore
 */
export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  const convRef = doc(db, "conversations", conversationId);
  await deleteDoc(convRef);
};
