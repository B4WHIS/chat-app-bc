import React, { useState } from "react";
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
import { Avatar } from "../../components/Avatar";
import ChatInputToolbar from "../../components/ChatInputToolbar";
import MessageBubble from "../../components/MessageBubble";
import { IMessage } from "../../types";

export interface ChatRoomScreenProps {
  navigation?: {
    goBack: () => void;
    navigate?: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: {
    params?: {
      conversationId?: string;
      partnerId?: string;
      partnerName?: string;
      partnerAvatar?: string;
    };
  };
}

// User IDs tạm thời phục vụ mock data và kiểm thử UI
const CURRENT_USER_ID = "user_chau";
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
    senderId: CURRENT_USER_ID,
    text: "Tuyệt vời! Mình đã hoàn thiện xong cả MessageBubble cho Task C3 rồi.",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 6),
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: DEFAULT_PARTNER_ID,
    text: "Tiến độ Sprint 1 chuẩn chỉ quá 👍",
    type: "text",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: CURRENT_USER_ID,
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
  const partnerName = route?.params?.partnerName ?? DEFAULT_PARTNER_NAME;
  const partnerAvatar = route?.params?.partnerAvatar;
  const conversationId = route?.params?.conversationId ?? "conv-1";

  const [messages, setMessages] = useState<IMessage[]>(INITIAL_MESSAGES);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else {
      Alert.alert("Thông báo", "Quay lại màn hình trước");
    }
  };

  const handleSendMessage = (text: string) => {
    const newMessage: IMessage = {
      id: Date.now().toString(),
      conversationId: conversationId,
      senderId: CURRENT_USER_ID,
      text: text,
      type: "text",
      status: "sending",
      createdAt: new Date(),
    };

    // FlatList inverted: tin mới nhất luôn được thêm vào đầu mảng
    setMessages((prevMessages) => [newMessage, ...prevMessages]);
  };

  const handlePickImage = () => {
    // Mô phỏng gửi một tin nhắn ảnh từ mock gallery
    const newImageMessage: IMessage = {
      id: Date.now().toString(),
      conversationId: conversationId,
      senderId: CURRENT_USER_ID,
      text: "Hình ảnh vừa gửi 📸",
      mediaUrls: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80",
      ],
      type: "image",
      status: "sending",
      createdAt: new Date(),
    };

    setMessages((prevMessages) => [newImageMessage, ...prevMessages]);
  };

  // Render từng tin nhắn sử dụng component MessageBubble (Task C3)
  const renderMessageItem = ({ item }: ListRenderItemInfo<IMessage>) => {
    const isMyMessage = item.senderId === CURRENT_USER_ID;

    return (
      <MessageBubble
        message={item}
        isMyMessage={isMyMessage}
        senderAvatarUrl={partnerAvatar}
        senderName={partnerName}
        onPressImage={(url) => {
          Alert.alert("Xem ảnh", url);
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header màn hình phòng chat */}
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
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Đang hoạt động</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
              <Ionicons name="call-outline" size={22} color="#2D6A4F" />
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
        />

        {/* Thanh gõ tin nhắn ChatInputToolbar */}
        <ChatInputToolbar
          onSendMessage={handleSendMessage}
          onPickImage={handlePickImage}
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
    backgroundColor: "#10B981",
    marginRight: 6,
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
    padding: 8,
    marginLeft: 4,
  },
  messageListContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

export default ChatRoomScreen;
