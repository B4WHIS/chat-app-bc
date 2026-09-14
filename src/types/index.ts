// 1. Bảng users
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: any;
  createdAt: any;
}

// 2. Bảng conversations
export interface IConversation {
  id: string;
  participantIds: string[]; // Danh sách ID các thành viên trong phòng
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: any;
  unreadCount?: number;
  updatedAt: any;
}

// 3. Bảng messages
export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  type: "text" | "image";
  status: "sending" | "sent" | "read";
  createdAt: any;
}
