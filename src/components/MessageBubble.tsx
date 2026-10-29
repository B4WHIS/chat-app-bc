import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import { IMessage } from "../types";

export interface MessageBubbleProps {
  message: IMessage;
  isMyMessage: boolean;
  senderAvatarUrl?: string;
  senderName?: string;
  onPressImage?: (imageUrl: string) => void;
  showSeenLabel?: boolean; // Hiển thị nhãn "Đã xem" cạnh giờ gửi tin nhắn cuối (TASK-C3.3)
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 320);

const formatMessageTime = (dateInput: unknown): string => {
  if (!dateInput) return "";

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime())
      ? ""
      : dateInput.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (typeof dateInput === "number" || typeof dateInput === "string") {
    const d = new Date(dateInput);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (
    typeof dateInput === "object" &&
    dateInput !== null &&
    "toDate" in dateInput &&
    typeof (dateInput as { toDate: () => Date }).toDate === "function"
  ) {
    const d = (dateInput as { toDate: () => Date }).toDate();
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return "";
};

/**
 * Component hiển thị ảnh với hiệu ứng loading spinner và bo góc chuẩn
 */
interface ImageWithLoaderProps {
  uri: string;
  style: any;
  wrapperStyle?: any;
  onPress?: () => void;
}

const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  uri,
  style,
  wrapperStyle,
  onPress,
}) => {
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.imageWithLoaderWrapper, wrapperStyle]}
    >
      {loading && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="small" color="#2D6A4F" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={style}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
    </TouchableOpacity>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  senderAvatarUrl,
  senderName,
  onPressImage,
  showSeenLabel = false,
}) => {
  const hasImages = Array.isArray(message.mediaUrls) && message.mediaUrls.length > 0;
  const timeString = formatMessageTime(message.createdAt);

  // Render ô ảnh theo mảng mediaUrls
  const renderMedia = () => {
    if (!hasImages || !message.mediaUrls) return null;

    const urls = message.mediaUrls;
    const count = urls.length;

    // 1 ảnh duy nhất
    if (count === 1) {
      return (
        <ImageWithLoader
          uri={urls[0]}
          style={styles.singleImage}
          wrapperStyle={styles.singleImageWrapper}
          onPress={() => onPressImage?.(urls[0])}
        />
      );
    }

    // Nhiều ảnh: hiển thị dạng lưới ô ảnh (Grid)
    return (
      <View style={styles.gridContainer}>
        {urls.map((url, index) => {
          const isEvenCount = count % 2 === 0;
          const isLastSingle = !isEvenCount && index === count - 1;

          return (
            <ImageWithLoader
              key={`${url}-${index}`}
              uri={url}
              style={styles.gridImage}
              wrapperStyle={[
                styles.gridImageWrapper,
                isLastSingle && styles.gridImageWrapperFull,
              ]}
              onPress={() => onPressImage?.(url)}
            />
          );
        })}
      </View>
    );
  };

  // Render trạng thái tin nhắn cho tin nhắn của mình (TASK-C3.3: Seen Receipt)
  const renderStatus = () => {
    if (!isMyMessage) return null;

    if (message.status === "sending") {
      return (
        <Ionicons
          name="time-outline"
          size={12}
          color="rgba(255, 255, 255, 0.7)"
          style={styles.statusIcon}
        />
      );
    }

    if (message.status === "read") {
      return (
        <View style={styles.readStatusContainer}>
          {showSeenLabel && (
            <Text style={styles.seenLabelText}>Đã xem</Text>
          )}
          <Ionicons
            name="checkmark-done"
            size={14}
            color="#93C5FD"
            style={styles.statusIcon}
          />
        </View>
      );
    }

    // Default "sent"
    return (
      <Ionicons
        name="checkmark"
        size={12}
        color="rgba(255, 255, 255, 0.7)"
        style={styles.statusIcon}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myContainer : styles.partnerContainer,
      ]}
    >
      {/* Avatar nhỏ bên cạnh cho tin nhắn của đối phương */}
      {!isMyMessage && (
        <View style={styles.avatarWrapper}>
          <Avatar uri={senderAvatarUrl} name={senderName} size={30} />
        </View>
      )}

      {/* Bong bóng tin nhắn */}
      <View
        style={[
          styles.bubble,
          isMyMessage ? styles.myBubble : styles.partnerBubble,
        ]}
      >
        {/* Render ảnh nếu có */}
        {renderMedia()}

        {/* Nội dung text tin nhắn */}
        {Boolean(message.text) && (
          <Text
            style={[
              styles.text,
              isMyMessage ? styles.myText : styles.partnerText,
              hasImages && styles.textWithImage,
            ]}
          >
            {message.text}
          </Text>
        )}

        {/* Giờ gửi và trạng thái */}
        <View style={styles.footer}>
          {Boolean(timeString) && (
            <Text
              style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.partnerTimeText,
              ]}
            >
              {timeString}
            </Text>
          )}
          {renderStatus()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  myContainer: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  partnerContainer: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  avatarWrapper: {
    marginRight: 6,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: "#2D6A4F",
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: "#FFFFFF",
  },
  partnerText: {
    color: "#1F2937",
  },
  textWithImage: {
    marginTop: 6,
  },
  imageWithLoaderWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  spinnerContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  singleImageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  singleImage: {
    width: MAX_BUBBLE_WIDTH - 24,
    height: 180,
    borderRadius: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridImageWrapper: {
    width: (MAX_BUBBLE_WIDTH - 28) / 2,
    height: 95,
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImageWrapperFull: {
    width: MAX_BUBBLE_WIDTH - 24,
    height: 120,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  myTimeText: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  partnerTimeText: {
    color: "#6B7280",
  },
  statusIcon: {
    marginLeft: 4,
  },
  readStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  seenLabelText: {
    fontSize: 10,
    color: "#BAE6FD",
    marginRight: 2,
    fontWeight: "600",
  },
});

export default MessageBubble;
