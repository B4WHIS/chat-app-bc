import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { IMessage, IConversation, IUser } from "../types";
import { getUserProfile } from "./userService";
import { sendPushNotification } from "./notificationService";

/**
 * Chuẩn hóa thời gian sang milliseconds phục vụ sắp xếp tin nhắn
 */
export const normalizeTimestamp = (val: unknown): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val instanceof Date) return val.getTime();
  if (typeof val === "string") {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === "object" && val !== null) {
    if ("toMillis" in val && typeof (val as Record<string, unknown>).toMillis === "function") {
      return (val as { toMillis: () => number }).toMillis();
    }
    if ("seconds" in val && typeof (val as Record<string, unknown>).seconds === "number") {
      return (val as { seconds: number }).seconds * 1000;
    }
  }
  return 0;
};

export interface SendMessageOptions {
  mediaUrls?: string[];
  type?: "text" | "image";
  partnerUser?: IUser | { id: string; displayName?: string; avatarUrl?: string };
  myUser?: { id: string; displayName?: string; avatarUrl?: string };
  partnerId?: string;
}

/**
 * Đảm bảo conversation document tồn tại TRƯỚC khi gửi tin nhắn.
 * Nếu chưa có, tạo mới. Nếu đã có, không làm gì.
 */
const ensureConversationExists = async (
  conversationId: string,
  senderId: string,
  partnerId: string,
  myDisplayName: string,
  myAvatarUrl: string,
  partnerDisplayName: string,
  partnerAvatarUrl: string
): Promise<void> => {
  const convRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(convRef);

  if (!convSnap.exists()) {
    // Tạo conversation mới với dữ liệu tối giản, không có giá trị undefined
    const newConv: Record<string, unknown> = {
      id: conversationId,
      participantIds: [senderId, partnerId],
      participantsMap: {
        [senderId]: {
          displayName: myDisplayName,
          avatarUrl: myAvatarUrl,
        },
        [partnerId]: {
          displayName: partnerDisplayName,
          avatarUrl: partnerAvatarUrl,
        },
      },
      lastMessageText: "",
      lastMessageSenderId: "",
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {
        [senderId]: 0,
        [partnerId]: 0,
      },
      pinnedBy: [],
      mutedBy: [],
      updatedAt: serverTimestamp(),
    };

    await setDoc(convRef, newConv);
  } else {
    // Đảm bảo participantIds luôn là Array chuẩn để Firestore query array-contains hoạt động chuẩn 100%
    const data = convSnap.data();
    if (!Array.isArray(data.participantIds)) {
      await updateDoc(convRef, {
        participantIds: [senderId, partnerId],
        pinnedBy: Array.isArray(data.pinnedBy) ? data.pinnedBy : [],
        mutedBy: Array.isArray(data.mutedBy) ? data.mutedBy : [],
      });
    }
  }
};

/**
 * Gửi tin nhắn vào Firestore.
 * 1. Đảm bảo conversation document tồn tại
 * 2. Ghi tin nhắn mới vào collection "messages"
 * 3. Cập nhật lastMessage trên conversation document
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  options?: SendMessageOptions
): Promise<IMessage> => {
  const trimmedText = text.trim();
  const mediaUrls = options?.mediaUrls || [];
  const messageType = options?.type || (mediaUrls.length > 0 ? "image" : "text");
  const displayText = trimmedText || (mediaUrls.length > 0 ? "[Hình ảnh]" : "");

  const partnerUser = options?.partnerUser;
  const myUser = options?.myUser;
  let partnerId = partnerUser?.id || options?.partnerId || "";
  // Đảm bảo partnerId luôn là đối phương, không bao giờ là chính senderId
  if (!partnerId || partnerId === senderId) {
    if (conversationId && conversationId.includes("_")) {
      const candidate = conversationId.split("_").find((id) => id !== senderId);
      if (candidate) {
        partnerId = candidate;
      }
    }
  }
  if (!partnerId) {
    const convRef = doc(db, "conversations", conversationId);
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data();
      const found = (convData.participantIds as string[] | undefined)?.find(
        (id) => id !== senderId
      );
      if (found) {
        partnerId = found;
      }
    }
  }

  if (!partnerId) {
    throw new Error("Không xác định được người nhận tin nhắn");
  }

  // Bước 1: Đảm bảo conversation tồn tại
  await ensureConversationExists(
    conversationId,
    senderId,
    partnerId,
    myUser?.displayName || "Bạn",
    myUser?.avatarUrl || "",
    partnerUser?.displayName || "Bạn bè",
    partnerUser?.avatarUrl || ""
  );

  // Bước 2: Ghi tin nhắn
  const messagePayload = {
    conversationId,
    senderId,
    text: trimmedText,
    mediaUrls,
    type: messageType,
    status: "sent" as const,
    createdAt: serverTimestamp(),
  };

  const messagesCollectionRef = collection(db, "messages");
  const docRef = await addDoc(messagesCollectionRef, messagePayload);

  // Bước 3: Cập nhật lastMessage trên conversation
  const convRef = doc(db, "conversations", conversationId);
  const updatePayload: Record<string, unknown> = {
    lastMessageText: displayText,
    lastMessageSenderId: senderId,
    lastMessageTimestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (partnerId) {
    updatePayload[`unreadCount.${partnerId}`] = increment(1);
  }

  await updateDoc(convRef, updatePayload);

  // Bước 4 (TASK-B4.2): Tự động gửi thông báo đẩy (Push Notification) cho ĐỐI PHƯƠNG (không gửi cho chính mình)
  if (partnerId && partnerId !== senderId) {
    (async () => {
      try {
        const partnerProfile = await getUserProfile(partnerId);
        if (partnerProfile) {
          const targetToken = partnerProfile.pushToken || partnerProfile.fcmToken;
          if (targetToken) {
            const senderName = myUser?.displayName || "Tin nhắn mới";
            await sendPushNotification({
              pushToken: targetToken,
              title: senderName,
              body: displayText || "Bạn có tin nhắn mới",
              data: {
                conversationId,
                partnerId: senderId,
                partnerName: senderName,
                partnerAvatar: myUser?.avatarUrl || "",
              },
            });
            console.log(`=> Đã gửi Push Notification tới đối phương (${partnerId}):`, targetToken);
          } else {
            console.log(`=> Đối phương (${partnerId}) chưa có pushToken trên Firestore.`);
          }
        }
      } catch (pushErr) {
        console.warn("Lỗi gửi push notification cho đối phương:", pushErr);
      }
    })();
  }

  return {
    id: docRef.id,
    ...messagePayload,
  };
};

/**
 * Lắng nghe tin nhắn theo thời gian thực qua onSnapshot với giới hạn ban đầu (mặc định 20 tin).
 * Trả về hàm unsubscribe.
 */
export const subscribeMessages = (
  conversationId: string,
  onUpdate: (
    messages: IMessage[],
    lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null
  ) => void,
  onError?: (error: Error) => void,
  limitCount: number = 20
): (() => void) => {
  if (!conversationId) {
    onUpdate([], null);
    return () => {};
  }

  const messagesRef = collection(db, "messages");
  // Query 20 tin nhắn mới nhất
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list: IMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data({ serverTimestamps: "estimate" });
        list.push({
          id: docSnap.id,
          conversationId: data.conversationId || conversationId,
          senderId: data.senderId || "",
          text: data.text || "",
          mediaUrls: data.mediaUrls || [],
          type: data.type || "text",
          status: docSnap.metadata.hasPendingWrites ? "sending" : data.status || "sent",
          createdAt: data.createdAt,
        });
      });

      // Sắp xếp giảm dần theo thời gian (tin mới nhất ở index 0 cho FlatList inverted)
      list.sort((a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt));

      // Lấy snapshot của tin nhắn cũ nhất trong batch này để phục vụ phân trang startAfter
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      onUpdate(list, lastDoc);
    },
    (error) => {
      console.error("subscribeMessages error:", error);
      onError?.(error);
    }
  );

  return unsubscribe;
};

export interface LoadMoreMessagesResult {
  messages: IMessage[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Nâng Cấp Message Engine Hỗ Trợ Phân Trang (TASK-C4.1 - Message Pagination / Infinite Scroll)
 * Tải thêm limitCount tin nhắn cũ hơn doc hiện tại sử dụng startAfter() và limit()
 *
 * @param conversationId ID cuộc hội thoại
 * @param lastDoc Document snapshot của tin nhắn cũ nhất trong batch trước
 * @param limitCount Số lượng tin nhắn cần tải mỗi trang (mặc định 20)
 */
export const loadMoreMessages = async (
  conversationId: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null,
  limitCount: number = 20
): Promise<LoadMoreMessagesResult> => {
  if (!conversationId) {
    return { messages: [], lastDoc: null, hasMore: false };
  }

  const messagesRef = collection(db, "messages");

  try {
    let q;
    if (lastDoc) {
      q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        startAfter(lastDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const list: IMessage[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data({ serverTimestamps: "estimate" });
      list.push({
        id: docSnap.id,
        conversationId: data.conversationId || conversationId,
        senderId: data.senderId || "",
        text: data.text || "",
        mediaUrls: data.mediaUrls || [],
        type: data.type || "text",
        status: data.status || "sent",
        createdAt: data.createdAt,
      });
    });

    list.sort((a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt));

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const hasMore = snapshot.docs.length >= limitCount;

    return {
      messages: list,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.warn("Lỗi loadMoreMessages:", error);
    return { messages: [], lastDoc, hasMore: false };
  }
};

/**
 * Đánh dấu đã đọc tin nhắn trong cuộc hội thoại (TASK-C3.3 - Seen Receipt)
 * 1. Cập nhật status: "read" cho các tin nhắn do đối phương gửi
 * 2. Cập nhật unreadCount[currentUserId]: 0 trên conversation document
 */
export const markMessagesAsRead = async (
  conversationId: string,
  currentUserId: string,
  unreadMessageIds?: string[]
): Promise<void> => {
  if (!conversationId || !currentUserId) return;

  try {
    const convRef = doc(db, "conversations", conversationId);
    let targetIds: string[] = [];

    if (Array.isArray(unreadMessageIds)) {
      targetIds = unreadMessageIds;
    } else {
      // Query các tin nhắn chưa đọc của hội thoại
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        limit(500)
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId !== currentUserId && data.status !== "read") {
          targetIds.push(docSnap.id);
        }
      });
    }

    // Nếu không có tin nhắn nào cần đánh dấu, chỉ reset unreadCount
    if (targetIds.length === 0) {
      await updateDoc(convRef, {
        [`unreadCount.${currentUserId}`]: 0,
      }).catch(() => {});
      return;
    }

    // Chia thành các batch tối đa 500 writes theo giới hạn của Firestore
    const CHUNK_SIZE = 500;
    for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
      const chunk = targetIds.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((msgId) => {
        const msgRef = doc(db, "messages", msgId);
        batch.update(msgRef, { status: "read" });
      });
      await batch.commit();
    }

    // Reset unreadCount sau khi cập nhật tin nhắn thành công
    await updateDoc(convRef, {
      [`unreadCount.${currentUserId}`]: 0,
    }).catch(() => {});
  } catch (error) {
    console.warn("Lỗi đánh dấu tin nhắn đã đọc (markMessagesAsRead):", error);
  }
};
