import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Avatar } from "../../components/Avatar";
import ChatInputToolbar from "../../components/ChatInputToolbar";
import MessageBubble from "../../components/MessageBubble";
import ImageViewerModal from "../../components/ImageViewerModal";
import TypingIndicator from "../../components/TypingIndicator";
import AppButton from "../../components/AppButton";
import { auth } from "../../config/firebase";
import {
  sendMessage,
  subscribeMessages,
  markMessagesAsRead,
  loadMoreMessages,
} from "../../services/messageService";
import { uploadChatImage } from "../../services/storageService";
import {
  subscribeUserPresence,
  formatLastSeen,
} from "../../services/presenceService";
import {
  setTypingStatus,
  subscribeTypingUsers,
} from "../../services/conversationService";
import {
  getCachedMessages,
  setCachedMessages,
} from "../../services/cacheService";
import { IMessage, IUser, IConversation } from "../../types";
import { useFocusEffect } from "@react-navigation/native";
import { setCurrentActiveConversationId } from "../../services/notificationService";

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

  // Nếu là phiên demo chưa đăng nhập thì hiện mock messages, nếu đã đăng nhập thật thì luôn kết nối Firestore Real-time
  const isDefaultDemo =
    !auth.currentUser &&
    (!route?.params?.conversationId || route.params.conversationId === "conv-1") &&
    !partnerUser;

  const [messages, setMessages] = useState<IMessage[]>(
    isDefaultDemo ? INITIAL_MESSAGES : []
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Phân trang dữ liệu tin nhắn cũ (TASK-C4.1 - Message Pagination)
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Theo dõi trạng thái trực tuyến (isOnline / lastSeen) thời gian thực của đối phương (TASK-C3.1)
  const [partnerPresence, setPartnerPresence] = useState<{
    isOnline: boolean;
    lastSeen?: any;
  }>({
    isOnline: partnerUser?.isOnline ?? true,
    lastSeen: partnerUser?.lastSeen,
  });

  useEffect(() => {
    if (!partnerId || isDefaultDemo) return;

    const unsubscribe = subscribeUserPresence(partnerId, (presence) => {
      setPartnerPresence(presence);
    });

    return () => {
      unsubscribe();
    };
  }, [partnerId, isDefaultDemo]);

  // Cập nhật ID phòng chat đang mở (theo trạng thái Focus của màn hình) để tránh hiện popup đè khi đang đọc chat (TASK-B4.2)
  useFocusEffect(
    React.useCallback(() => {
      if (conversationId) {
        setCurrentActiveConversationId(conversationId);
      }
      return () => {
        setCurrentActiveConversationId(null);
      };
    }, [conversationId])
  );

  // Quản lý trạng thái đang soạn tin (Typing Indicator - TASK-C3.2)
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);
  const readTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lắng nghe real-time typingUsers trong conversation
  useEffect(() => {
    if (!conversationId || isDefaultDemo) return;

    const unsubscribe = subscribeTypingUsers(conversationId, (users) => {
      setTypingUsers(users);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, isDefaultDemo]);

  // Dọn dẹp typing status khi rời khỏi phòng chat hoặc unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTypingRef.current && conversationId && !isDefaultDemo) {
        setTypingStatus(conversationId, currentUserId, false);
      }
    };
  }, [conversationId, currentUserId, isDefaultDemo]);

  // Bắt sự kiện gõ phím trên TextInput với debounce 2s (TASK-C3.2)
  const handleInputChange = (text: string) => {
    if (!conversationId || isDefaultDemo) return;

    if (text.length > 0) {
      if (!isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = true;
        setTypingStatus(conversationId, currentUserId, true);
      }

      // Reset timer nếu user vẫn tiếp tục gõ phím
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Tự động hủy trạng thái đang gõ sau 2 giây ngừng gõ
      typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTypingRef.current = false;
        setTypingStatus(conversationId, currentUserId, false);
      }, 2000);
    } else {
      // Khi ô nhập tin nhắn trống
      if (isCurrentlyTypingRef.current) {
        isCurrentlyTypingRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        setTypingStatus(conversationId, currentUserId, false);
      }
    }
  };

  // Lắng nghe tin nhắn thời gian thực qua Cloud Firestore onSnapshot (TASK-C2.2, C3.3 & C4.1)
  useEffect(() => {
    if (!conversationId) return;

    if (isDefaultDemo) {
      setMessages(INITIAL_MESSAGES);
      return;
    }

    // Khi mở phòng chat: Đánh dấu đã đọc và reset unreadCount về 0 (TASK-C3.3)
    markMessagesAsRead(conversationId, currentUserId);

    // Nạp tin nhắn từ AsyncStorage cache để hiển thị tức thì không bị màn hình trắng (TASK-C4.2)
    getCachedMessages(conversationId).then((cached) => {
      if (cached && cached.length > 0) {
        setMessages((prev) => (prev.length === 0 ? cached : prev));
      }
    });

    // Tải 20 tin nhắn đầu tiên và lắng nghe real-time (TASK-C4.1)
    const unsubscribe = subscribeMessages(
      conversationId,
      (realtimeMessages, initialLastDoc) => {
        // Cập nhật cache cục bộ (TASK-C4.2)
        setCachedMessages(conversationId, realtimeMessages);

        setMessages((prev) => {
          const realtimeIds = new Set(realtimeMessages.map((m) => m.id));
          // Giữ lại các tin nhắn cũ hơn đã tải thêm bằng infinite scroll
          const olderPagedMessages = prev.filter((m) => !realtimeIds.has(m.id));
          return [...realtimeMessages, ...olderPagedMessages];
        });

        // Lưu document snapshot cuối cùng của batch đầu để phục vụ phân trang
        if (!lastDocRef.current) {
          lastDocRef.current = initialLastDoc;
        }

        // Lấy danh sách ID các tin nhắn từ đối phương chưa ở trạng thái "read"
        const unreadPartnerMsgIds = realtimeMessages
          .filter(
            (m) =>
              m.senderId !== currentUserId &&
              m.status !== "read" &&
              !m.id.startsWith("temp-")
          )
          .map((m) => m.id);

        // Debounce đánh dấu đã đọc khoảng 800ms để tránh ghi Firestore dồn dập
        if (unreadPartnerMsgIds.length > 0) {
          if (readTimeoutRef.current) {
            clearTimeout(readTimeoutRef.current);
          }
          readTimeoutRef.current = setTimeout(() => {
            markMessagesAsRead(conversationId, currentUserId, unreadPartnerMsgIds);
          }, 800);
        }
      },
      (error) => {
        console.warn("Lỗi tải tin nhắn real-time:", error);
      },
      20
    );

    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [conversationId, isDefaultDemo, currentUserId, partnerUser]);

  // Phân trang tải thêm 20 tin nhắn cũ khi cuộn lên trên đỉnh FlatList (TASK-C4.1 - Infinite Scroll)
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !conversationId || isDefaultDemo) return;
    if (!lastDocRef.current) return;

    setLoadingMore(true);
    try {
      const result = await loadMoreMessages(
        conversationId,
        lastDocRef.current,
        20
      );

      if (result.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = result.messages.filter(
            (m) => !existingIds.has(m.id)
          );
          return [...prev, ...uniqueOlder];
        });
        lastDocRef.current = result.lastDoc;
      }

      setHasMore(result.hasMore);
    } catch (err) {
      console.warn("Lỗi tải thêm tin nhắn cũ:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleBack = () => {
    if (readTimeoutRef.current) {
      clearTimeout(readTimeoutRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isCurrentlyTypingRef.current && conversationId && !isDefaultDemo) {
      setTypingStatus(conversationId, currentUserId, false);
    }

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

    // Reset trạng thái đang gõ ngay khi bấm Gửi
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isCurrentlyTypingRef.current && conversationId && !isDefaultDemo) {
      isCurrentlyTypingRef.current = false;
      setTypingStatus(conversationId, currentUserId, false);
    }

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

  // Xác định vị trí tin nhắn mới nhất do mình gửi để hiển thị nhãn "Đã xem" (TASK-C3.3)
  const lastMyMessageIndex = messages.findIndex(
    (m) => m.senderId === currentUserId
  );

  // Render từng tin nhắn sử dụng component MessageBubble
  const renderMessageItem = ({ item, index }: ListRenderItemInfo<IMessage>) => {
    const isMyMessage = item.senderId === currentUserId;
    const isLastMyMessage = index === lastMyMessageIndex;

    return (
      <MessageBubble
        message={item}
        isMyMessage={isMyMessage}
        senderAvatarUrl={partnerAvatar}
        senderName={partnerName}
        showSeenLabel={isLastMyMessage}
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

  // Vòng quay loading nhỏ trên đỉnh FlatList khi đang cuộn tải thêm tin nhắn cũ (TASK-C4.1)
  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#2D6A4F" />
        <Text style={styles.loadingMoreText}>Đang tải tin nhắn cũ...</Text>
      </View>
    );
  };

  // Kiểm tra xem đối phương có đang soạn tin nhắn không (TASK-C3.2)
  const isPartnerTyping = partnerId ? typingUsers.includes(partnerId) : false;

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
            <Avatar
              uri={partnerAvatar}
              name={partnerName}
              size={42}
              isOnline={partnerPresence.isOnline}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.partnerNameText} numberOfLines={1}>
                {partnerName}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.onlineDot,
                    partnerPresence.isOnline ? styles.onlineDotActive : styles.onlineDotInactive,
                  ]}
                />
                <Text style={styles.statusText}>
                  {partnerPresence.isOnline
                    ? "Đang hoạt động"
                    : formatLastSeen(partnerPresence.lastSeen)}
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

        {/* Danh sách tin nhắn cuộn ngược với phân trang Infinite Scroll & tối ưu 60fps (TASK-C4.1 & C4.2) */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          inverted={true}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyChat}
          ListFooterComponent={renderListFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        {/* Chỉ báo đối phương đang soạn tin nhắn (TASK-C3.2) */}
        <TypingIndicator
          visible={isPartnerTyping}
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
        />

        {/* Thanh gõ tin nhắn ChatInputToolbar gắn AppButton ở đáy màn hình */}
        <ChatInputToolbar
          onChangeText={handleInputChange}
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
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
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
