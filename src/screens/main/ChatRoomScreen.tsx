import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ListRenderItemInfo,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "../../components/Avatar";
import ChatInputToolbar from "../../components/ChatInputToolbar";
import MessageBubble from "../../components/MessageBubble";
import ImageViewerModal from "../../components/ImageViewerModal";
import AppButton from "../../components/AppButton";
import { auth } from "../../config/firebase";
import {
  sendMessage,
  subscribeMessages,
} from "../../services/messageService";
import { uploadChatImage } from "../../services/storageService";
import { IMessage, IUser, IConversation } from "../../types";

export interface ChatRoomRouteParams {
  conversationId?: string;
  partnerId?: string;
  partnerName?: string;
  partnerAvatar?: string;
  partnerUser?: IUser;
  conversation?: IConversation;
}

export interface ChatRoomScreenProps {
  navigation?: {
    goBack: () => void;
    navigate?: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: {
    params?: ChatRoomRouteParams;
  };
}

// User IDs mặc định phục vụ mock data và fallback kiểm thử UI
const DEFAULT_MY_ID = "user_chau";
const DEFAULT_PARTNER_ID = "user_binh";
const DEFAULT_PARTNER_NAME = "Bình";

// Dữ liệu tin nhắn mẫu (FlatList inverted sắp xếp từ tin mới nhất ở index 0)
const INITIAL_MESSAGES: IMessage[] = [
  {
    id: "msg-5",
    conversationId: "conv-1",
    senderId: DEFAULT_PARTNER_ID,
    text: "Giao diện demo các tính năng nè!",
    mediaUrls: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    ],
    type: "image",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 1),
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    senderId: DEFAULT_PARTNER_ID,
    text: "Chào Châu, mình đã xong giao diện Login & Register rồi nhé!",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    senderId: DEFAULT_MY_ID,
    text: "Tuyệt vời! Mình đang hoàn thiện ghép nối màn hình ChatRoomScreen cho Sprint 2.",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 6),
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: DEFAULT_PARTNER_ID,
    text: "Tiến độ Sprint 2 chuẩn chỉ quá 👍",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: DEFAULT_MY_ID,
    text: "Alo Bình ơi",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
];

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  navigation,
  route,
}) => {
  // Lấy thông tin partnerUser và conversationId từ navigation route params (TASK-C2.1 & C2.2)
  const partnerUser = route?.params?.partnerUser;
  const partnerId =
    partnerUser?.id || route?.params?.partnerId || DEFAULT_PARTNER_ID;
  const partnerName =
    partnerUser?.displayName ||
    route?.params?.partnerName ||
    (partnerUser?.email ? partnerUser.email.split("@")[0] : undefined) ||
    DEFAULT_PARTNER_NAME;
  const partnerAvatar = partnerUser?.avatarUrl || route?.params?.partnerAvatar;

  const currentUserId = auth.currentUser?.uid || DEFAULT_MY_ID;
  const conversationId =
    route?.params?.conversationId ||
    (partnerId ? [currentUserId, partnerId].sort().join("_") : "conv-1");

  // Kiểm tra trạng thái hoạt động của đối phương
  const isOnline = partnerUser?.isOnline ?? true;

  // Nếu là phiên demo độc lập thì hiện mock messages, nếu mở phòng chat thực tế thì kết nối Firestore Real-time
  const isDefaultDemo =
    (!route?.params?.conversationId || route.params.conversationId === "conv-1") &&
    !partnerUser;

  const [messages, setMessages] = useState<IMessage[]>(
    isDefaultDemo ? INITIAL_MESSAGES : []
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Lắng nghe tin nhắn thời gian thực qua Cloud Firestore onSnapshot (TASK-C2.2)
  useEffect(() => {
    if (!conversationId) return;

    if (isDefaultDemo) {
      setMessages(INITIAL_MESSAGES);
      return;
    }

    const unsubscribe = subscribeMessages(
      conversationId,
      (realtimeMessages) => {
        setMessages(realtimeMessages);
      },
      (error) => {
        console.warn("Lỗi tải tin nhắn real-time:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, isDefaultDemo, currentUserId, partnerUser]);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else {
      Alert.alert("Thông báo", "Quay lại màn hình trước");
    }
  };

  // Gửi tin nhắn mới (TASK-C2.2: lưu vào 'messages' và cập nhật 'conversations')
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistic UI: hiện ngay tin nhắn với trạng thái 'sending'
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: IMessage = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      text: trimmed,
      type: "text",
      status: "sending",
      createdAt: new Date(),
    };

    setMessages((prevMessages) => [optimisticMessage, ...prevMessages]);

    // Demo mode: chỉ cập nhật local state, không ghi lên Firestore
    if (isDefaultDemo) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
        );
      }, 300);
      return;
    }

    // Gửi qua messageService
    try {
      await sendMessage(conversationId, currentUserId, trimmed, {
        partnerUser:
          partnerUser ||
          (partnerId
            ? {
                id: partnerId,
                displayName: partnerName,
                avatarUrl: partnerAvatar,
              }
            : undefined),
        myUser: {
          id: currentUserId,
          displayName:
            auth.currentUser?.displayName ||
            auth.currentUser?.email?.split("@")[0] ||
            "Bạn",
          avatarUrl: auth.currentUser?.photoURL || "",
        },
      });
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Lỗi khi gửi tin nhắn:", errorMsg);
      Alert.alert("Lỗi gửi tin nhắn", errorMsg);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để gửi hình ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Không ép cắt ảnh vuông khi gửi tin nhắn
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      const localUri = selectedAsset.uri;
      const imagePayload = selectedAsset.base64
        ? `data:image/jpeg;base64,${selectedAsset.base64}`
        : localUri;
      const tempId = `temp-${Date.now()}`;

      const optimisticMessage: IMessage = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        text: "",
        mediaUrls: [localUri],
        type: "image",
        status: "sending",
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [optimisticMessage, ...prevMessages]);

      // Demo mode: chỉ cập nhật local state, không ghi lên Firestore
      if (isDefaultDemo) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
          );
        }, 400);
        return;
      }

      // Tải ảnh lên Cloudinary
      const downloadUrl = await uploadChatImage(imagePayload, conversationId);

      // Gửi tin nhắn chứa downloadUrl lên Firestore
      await sendMessage(conversationId, currentUserId, "", {
        mediaUrls: [downloadUrl],
        type: "image",
        partnerUser:
          partnerUser ||
          (partnerId
            ? {
                id: partnerId,
                displayName: partnerName,
                avatarUrl: partnerAvatar,
              }
            : undefined),
        myUser: {
          id: currentUserId,
          displayName:
            auth.currentUser?.displayName ||
            auth.currentUser?.email?.split("@")[0] ||
            "Bạn",
          avatarUrl: auth.currentUser?.photoURL || undefined,
        },
      });

      // Cập nhật Optimistic message với link ảnh chính thức
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, mediaUrls: [downloadUrl], status: "sent" }
            : m
        )
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Lỗi khi gửi ảnh:", errorMsg);
      Alert.alert("Lỗi gửi ảnh", errorMsg);
    }
  };

  // Render từng tin nhắn sử dụng component MessageBubble
  const renderMessageItem = ({ item }: ListRenderItemInfo<IMessage>) => {
    const isMyMessage = item.senderId === currentUserId;

    return (
      <MessageBubble
        message={item}
        isMyMessage={isMyMessage}
        senderAvatarUrl={partnerAvatar}
        senderName={partnerName}
        onPressImage={(url) => {
          setSelectedImage(url);
        }}
      />
    );
  };

  // Giao diện khi chưa có tin nhắn nào
  const renderEmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Avatar uri={partnerAvatar} name={partnerName} size={68} />
      <Text style={styles.emptyTitle}>{partnerName}</Text>
      <Text style={styles.emptySubtitle}>
        {partnerUser?.email ? `${partnerUser.email} • ` : ""}Hãy gửi lời chào đầu tiên để bắt đầu trò chuyện!
      </Text>
      <AppButton
        title="Gửi lời chào 👋"
        onPress={() => handleSendMessage("Xin chào! 👋 Rất vui được kết nối cùng bạn.")}
        style={styles.greetingButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header màn hình phòng chat (Avatar, Tên đối phương, Nút Back) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Avatar uri={partnerAvatar} name={partnerName} size={42} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.partnerNameText} numberOfLines={1}>
                {partnerName}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.onlineDot,
                    isOnline ? styles.onlineDotActive : styles.onlineDotInactive,
                  ]}
                />
                <Text style={styles.statusText}>
                  {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert("Cuộc gọi thoại", `Đang kết nối tới ${partnerName}...`)}
            >
              <Ionicons name="call-outline" size={22} color="#2D6A4F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert("Thông tin", `Hội thoại ID: ${conversationId}`)}
            >
              <Ionicons name="information-circle-outline" size={24} color="#2D6A4F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh sách tin nhắn cuộn ngược */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          inverted={true}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyChat}
        />

        {/* Thanh gõ tin nhắn ChatInputToolbar gắn AppButton ở đáy màn hình */}
        <ChatInputToolbar
          onSendMessage={handleSendMessage}
          onPickImage={handlePickImage}
        />

        {/* Modal xem ảnh toàn màn hình (TASK-B3.2) */}
        <ImageViewerModal
          visible={Boolean(selectedImage)}
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 6,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  partnerNameText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDotActive: {
    backgroundColor: "#10B981",
  },
  onlineDotInactive: {
    backgroundColor: "#9CA3AF",
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  messageListContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    transform: [{ scaleY: -1 }], // Cân bằng với FlatList inverted
    marginVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  greetingButton: {
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 23,
    marginVertical: 0,
  },
});

export default ChatRoomScreen;
