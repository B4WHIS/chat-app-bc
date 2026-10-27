import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { IMessage, IConversation, IUser } from "../types";

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

  return {
    id: docRef.id,
    ...messagePayload,
  };
};

/**
 * Lắng nghe tin nhắn theo thời gian thực qua onSnapshot.
 * Trả về hàm unsubscribe.
 */
export const subscribeMessages = (
  conversationId: string,
  onUpdate: (messages: IMessage[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!conversationId) {
    onUpdate([]);
    return () => {};
  }

  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, where("conversationId", "==", conversationId));

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

      list.sort((a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt));
      onUpdate(list);
    },
    (error) => {
      console.error("subscribeMessages error:", error);
      onError?.(error);
    }
  );

  return unsubscribe;
};
