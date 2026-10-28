import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Avatar } from "./Avatar";

export interface TypingIndicatorProps {
  partnerName?: string;
  partnerAvatar?: string;
  visible?: boolean;
}

/**
 * Dot component với hiệu ứng nhấp nhô tuần tự (Wave Bounce)
 */
const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 320, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 320, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

/**
 * Chỉ báo đang gõ tin nhắn (Typing Indicator) - TASK-C3.2
 * Hiển thị hiệu ứng 3 chấm nhấp nhô mượt mà cùng tên/avatar đối phương
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  partnerName,
  partnerAvatar,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      {/* Avatar đối phương */}
      <View style={styles.avatarWrapper}>
        <Avatar uri={partnerAvatar} name={partnerName} size={28} />
      </View>

      {/* Bong bóng chứa 3 chấm nhấp nhô */}
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={180} />
          <AnimatedDot delay={360} />
        </View>
        {Boolean(partnerName) && (
          <Text style={styles.typingText} numberOfLines={1}>
            {partnerName} đang soạn tin...
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 16,
    marginVertical: 6,
    alignSelf: "flex-start",
  },
  avatarWrapper: {
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.12)",
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 14,
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2D6A4F",
  },
  typingText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default TypingIndicator;
