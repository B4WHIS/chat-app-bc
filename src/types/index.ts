// 1. BẢNG USERS (Hồ sơ người dùng)
export interface IUser {
  id: string; // Trùng với Firebase Auth UID
  email: string; // Luôn lưu chữ thường (lowercase)
  displayName: string; // Tên hiển thị
  avatarUrl?: string; // Link ảnh đại diện
  isOnline: boolean; // Trạng thái online/offline
  lastSeen?: any; // Thời điểm cuối cùng mở app
  fcmToken?: string; // Token để sau này làm Push Notification (Sprint 4)
  createdAt: any;
}

// 2. BẢNG CONVERSATIONS (Cuộc hội thoại / Phòng chat)
export interface IConversation {
  id: string; // Đặt theo công thức: [uid1, uid2].sort().join('_') để chống trùng!
  participantIds: string[]; // Mảng chứa [uid1, uid2] để query danh sách
  participantsMap: {
    // Lưu sẵn Tên + Avatar để màn hình Inbox load siêu tốc!
    [userId: string]: {
      displayName: string;
      avatarUrl?: string;
    };
  };
  lastMessageText?: string; // Đoạn chat cuối (hoặc "[Hình ảnh]")
  lastMessageSenderId?: string; // Ai gửi tin cuối (để hiện chữ "Bạn: ...")
  lastMessageTimestamp?: any; // Giờ gửi tin cuối (để sắp xếp tin mới lên đầu)
  unreadCount?: {
    // Số tin chưa đọc tính riêng cho từng User
    [userId: string]: number;
  };
  updatedAt: any;
}

// 3. BẢNG MESSAGES (Chi tiết từng tin nhắn)
export interface IMessage {
  id: string;
  conversationId: string; // Thuộc phòng chat nào
  senderId: string; // Ai gửi tin nhắn này
  text?: string; // Nội dung chữ
  mediaUrls?: string[]; // Mảng ảnh (nếu gửi ảnh)
  type: "text" | "image"; // Loại tin nhắn
  status: "sending" | "sent" | "read"; // Trạng thái (Optimistic UI)
  createdAt: any; // Thời gian gửi
}
