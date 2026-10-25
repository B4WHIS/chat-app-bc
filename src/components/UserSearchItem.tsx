import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Avatar } from "./Avatar";
import { IUser } from "../types";

interface UserSearchItemProps {
  user: IUser;
  onViewProfile: (user: IUser) => void;
  onStartChat: (user: IUser) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const UserSearchItem: React.FC<UserSearchItemProps> = React.memo(
  ({ user, onViewProfile, onStartChat }) => {
    const cardScale = useSharedValue(1);
    const btnScale = useSharedValue(1);

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const animatedBtnStyle = useAnimatedStyle(() => ({
      transform: [{ scale: btnScale.value }],
    }));

    return (
      <Animated.View style={[styles.wrapper, animatedCardStyle]}>
        <View style={styles.cardContainer}>
          {/* Khu vực 1: Avatar + Tên + Email (Chạm để xem thông tin cá nhân) */}
          <Pressable
            style={styles.profileClickArea}
            onPress={() => onViewProfile(user)}
            onPressIn={() => {
              cardScale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
          >
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={user.avatarUrl}
                name={user.displayName || user.email}
                size={50}
              />
              {user.isOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {user.displayName || user.email.split("@")[0]}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#9CA3AF"
                  style={styles.chevronIcon}
                />
              </View>
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </Pressable>

          {/* Khu vực 2: Nút Nhắn tin riêng biệt */}
          <Animated.View style={animatedBtnStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onStartChat(user)}
              onPressIn={() => {
                btnScale.value = withSpring(0.92, { damping: 14 });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, { damping: 14 });
              }}
              style={styles.chatActionBtn}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.chatBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 18,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.08)",
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileClickArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  avatarWrapper: {
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    maxWidth: "85%",
  },
  chevronIcon: {
    marginLeft: 4,
  },
  emailText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  chatActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D6A4F",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chatBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
