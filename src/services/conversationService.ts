import {
  collection,
  doc,
  getDoc,
  getDocs,
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
        avatarUrl: myUser.avatarUrl || "",
      },
      [partnerUser.id]: {
        displayName: partnerUser.displayName || "Bạn bè",
        avatarUrl: partnerUser.avatarUrl || "",
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
        avatarUrl: myUser.avatarUrl || "",
      },
      [partnerUser.id]: {
        displayName: partnerUser.displayName || "Bạn bè",
        avatarUrl: partnerUser.avatarUrl || "",
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

/**
 * Tự động tìm các tin nhắn của user trên Firestore và khôi phục
 * document tương ứng trong collection 'conversations' nếu bị thiếu
 */
export const repairMissingConversations = async (userId: string): Promise<void> => {
  if (!userId) return;

  try {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("senderId", "==", userId));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const convIds = Array.from(
      new Set(snap.docs.map((d) => d.data().conversationId).filter(Boolean))
    );

    for (const convId of convIds) {
      if (convId === "conv-1") continue;
      const convRef = doc(db, "conversations", convId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        const parts = convId.split("_");
        const partnerId = parts.find((id: string) => id !== userId) || "";

        let partnerName = "Bạn bè";
        let partnerAvatar = "";
        if (partnerId) {
          const uSnap = await getDoc(doc(db, "users", partnerId));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            partnerName = uData.displayName || uData.email?.split("@")[0] || "Bạn bè";
            partnerAvatar = uData.avatarUrl || "";
          }
        }

        const allMsgQuery = query(messagesRef, where("conversationId", "==", convId));
        const allMsgSnap = await getDocs(allMsgQuery);
        let lastText = "";
        let lastSender = userId;

        if (!allMsgSnap.empty) {
          const msgs: { text?: string; mediaUrls?: string[]; senderId?: string; createdAt?: unknown }[] = [];
          allMsgSnap.forEach((d) => msgs.push(d.data()));
          const getMs = (val: unknown): number => {
            if (!val) return 0;
            if (typeof val === "number") return val;
            if (val instanceof Date) return val.getTime();
            if (typeof val === "string") return new Date(val).getTime() || 0;
            if (typeof val === "object" && val !== null && "toMillis" in val) {
              return (val as { toMillis: () => number }).toMillis();
            }
            if (typeof val === "object" && val !== null && "seconds" in val) {
              return (val as { seconds: number }).seconds * 1000;
            }
            return 0;
          };
          msgs.sort((a, b) => getMs(b.createdAt) - getMs(a.createdAt));
          lastText = msgs[0].text || (msgs[0].mediaUrls?.length ? "[Hình ảnh]" : "");
          lastSender = msgs[0].senderId || userId;
        }

        const newConv = {
          id: convId,
          participantIds: [userId, partnerId].filter(Boolean),
          participantsMap: {
            [userId]: { displayName: "Bạn", avatarUrl: "" },
            ...(partnerId ? { [partnerId]: { displayName: partnerName, avatarUrl: partnerAvatar } } : {}),
          },
          lastMessageText: lastText,
          lastMessageSenderId: lastSender,
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: { [userId]: 0, ...(partnerId ? { [partnerId]: 0 } : {}) },
          pinnedBy: [],
          mutedBy: [],
          updatedAt: serverTimestamp(),
        };

        await setDoc(convRef, newConv, { merge: true });
        console.log("Khôi phục thành công conversation record:", convId);
      }
    }
  } catch (err) {
    console.warn("Lỗi repairMissingConversations:", err);
  }
};
