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
    text: "Tuyệt vời! Mình đang hoàn thiện khung ChatRoomScreen và ChatInputToolbar.",
    type: "text",
    status: "sent",
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
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
];

const formatTime = (dateInput: Date | string | number | undefined): string => {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

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
    Alert.alert("Chọn ảnh", "Chức năng chọn ảnh sẽ mở thư viện ảnh.");
  };

  // Render từng tin nhắn trong khung chat
  // Lưu ý: Đây là render khung cơ bản của Task C2. Đến Task C3 sẽ thay thế bằng component MessageBubble.tsx chuyên dụng.
  const renderMessageItem = ({ item }: ListRenderItemInfo<IMessage>) => {
    const isMyMessage = item.senderId === CURRENT_USER_ID;

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.partnerMessageRow,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.partnerAvatarContainer}>
            <Avatar uri={partnerAvatar} name={partnerName} size={32} />
          </View>
        )}

        <View
          style={[
            styles.bubbleContainer,
            isMyMessage ? styles.myBubble : styles.partnerBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.partnerMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timeText,
              isMyMessage ? styles.myTimeText : styles.partnerTimeText,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
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
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  partnerMessageRow: {
    justifyContent: "flex-start",
  },
  partnerAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  bubbleContainer: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: "#2D6A4F",
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  partnerMessageText: {
    color: "#1F2937",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTimeText: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  partnerTimeText: {
    color: "#9CA3AF",
  },
});

export default ChatRoomScreen;
