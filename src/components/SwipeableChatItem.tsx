import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import { IConversation } from "../types";

export interface ExtendedConversation extends IConversation {
  isPinned?: boolean;
  isMuted?: boolean;
  isOnline?: boolean;
  partnerName?: string;
  partnerAvatar?: string;
}

interface SwipeableChatItemProps {
  conversation: ExtendedConversation;
  currentUserId?: string;
  onPress: (conversation: ExtendedConversation) => void;
  onPin: (conversation: ExtendedConversation) => void;
  onMute: (conversation: ExtendedConversation) => void;
  onDelete: (conversation: ExtendedConversation) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SwipeableChatItem: React.FC<SwipeableChatItemProps> = React.memo(
  ({
    conversation,
    currentUserId,
    onPress,
    onPin,
    onMute,
    onDelete,
  }) => {
    const scale = useSharedValue(1);
    const swipeableRef = React.useRef<SwipeableMethods | null>(null);

    // Extract partner info
    const partnerId = conversation.participantIds?.find(
      (id) => id !== currentUserId
    );
    const partner = partnerId
      ? conversation.participantsMap?.[partnerId]
      : undefined;

    const displayName =
      conversation.partnerName ||
      partner?.displayName ||
      "";
    const avatarUrl = conversation.partnerAvatar || partner?.avatarUrl;

    const unreadCount =
      (currentUserId && conversation.unreadCount?.[currentUserId]) || 0;
    const hasUnread = unreadCount > 0;

    const isMeLastSender =
      Boolean(currentUserId) &&
      conversation.lastMessageSenderId === currentUserId;

    // Format timestamp
    const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return "";
      if (typeof timestamp === "string") return timestamp;
      const date =
        timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins}p`;
      if (diffHours < 24) {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    };

    const formattedTime = formatTimestamp(
      conversation.lastMessageTimestamp || conversation.updatedAt
    );

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    // Right Actions component (Swipe from right to left)
    const renderRightActions = (
      progress: SharedValue<number>,
      translation: SharedValue<number>,
      swipeableMethods: SwipeableMethods
    ) => {
      return (
        <View style={styles.actionsContainer}>
          {/* Action 1: Pin */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              swipeableMethods.close();
              onPin(conversation);
            }}
            style={[styles.actionBtn, styles.pinAction]}
          >
            <Ionicons
              name={conversation.isPinned ? "pin-outline" : "pin"}
              size={20}
              color="#D97706"
            />
            <Text style={[styles.actionLabel, { color: "#B45309" }]}>
              {conversation.isPinned ? "Bỏ ghim" : "Ghim"}
            </Text>
          </TouchableOpacity>

          {/* Action 2: Mute */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              swipeableMethods.close();
              onMute(conversation);
            }}
            style={[styles.actionBtn, styles.muteAction]}
          >
            <Ionicons
              name={
                conversation.isMuted
                  ? "notifications-outline"
                  : "notifications-off-outline"
              }
              size={20}
              color="#6366F1"
            />
            <Text style={[styles.actionLabel, { color: "#4F46E5" }]}>
              {conversation.isMuted ? "Bật chuông" : "Tắt thông báo"}
            </Text>
          </TouchableOpacity>

          {/* Action 3: Delete */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              swipeableMethods.close();
              onDelete(conversation);
            }}
            style={[styles.actionBtn, styles.deleteAction]}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionLabel, { color: "#DC2626" }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={styles.wrapper}>
        <ReanimatedSwipeable
          ref={(ref) => {
            swipeableRef.current = ref;
          }}
          friction={1.5}
          overshootRight={false}
          renderRightActions={renderRightActions}
        >
          <AnimatedPressable
            onPress={() => onPress(conversation)}
            onPressIn={() => {
              scale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            style={[
              styles.cardContainer,
              conversation.isPinned && styles.pinnedCard,
              animatedCardStyle,
            ]}
          >
            {/* Avatar & Online Dot */}
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={avatarUrl}
                name={displayName}
                size={52}
                isOnline={conversation.isOnline}
              />

            </View>

            {/* Content Details */}
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <View style={styles.titleWithBadge}>
                  <Text
                    style={[styles.nameText, hasUnread && styles.unreadNameText]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  {conversation.isPinned && (
                    <Ionicons
                      name="pin"
                      size={13}
                      color="#2D6A4F"
                      style={styles.pinIcon}
                    />
                  )}
                  {conversation.isMuted && (
                    <Ionicons
                      name="volume-mute-outline"
                      size={14}
                      color="#9CA3AF"
                      style={styles.muteIcon}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.timeText,
                    hasUnread && styles.unreadTimeText,
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>

              {/* Message preview row */}
              <View style={styles.messageRow}>
                <Text
                  style={[
                    styles.messageText,
                    hasUnread && styles.unreadMessageText,
                  ]}
                  numberOfLines={1}
                >
                  {isMeLastSender ? "Bạn: " : ""}
                  {conversation.lastMessageText || "Bắt đầu cuộc trò chuyện..."}
                </Text>

                {/* Unread badge */}
                {hasUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCountText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </AnimatedPressable>
        </ReanimatedSwipeable>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.07)",
    // Subtle luxury shadow
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pinnedCard: {
    backgroundColor: "#F7FAF7",
    borderColor: "rgba(45, 106, 79, 0.16)",
  },
  avatarWrapper: {
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    maxWidth: "80%",
  },
  unreadNameText: {
    fontWeight: "700",
    color: "#0F172A",
  },
  pinIcon: {
    marginLeft: 6,
  },
  muteIcon: {
    marginLeft: 6,
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  unreadTimeText: {
    color: "#2D6A4F",
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 8,
  },
  unreadMessageText: {
    color: "#1F2937",
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: "#2D6A4F",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  actionBtn: {
    width: 62,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginLeft: 6,
    paddingVertical: 8,
  },
  pinAction: {
    backgroundColor: "#FEF3C7",
  },
  muteAction: {
    backgroundColor: "#EEF2FF",
  },
  deleteAction: {
    backgroundColor: "#FEE2E2",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
});
