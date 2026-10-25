import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const SearchSkeletonItem: React.FC = () => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 750 }),
        withTiming(0.35, { duration: 750 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Avatar circle */}
      <View style={styles.avatarPlaceholder} />

      {/* Text placeholders */}
      <View style={styles.textContainer}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.subtitlePlaceholder} />
      </View>

      {/* Action button placeholder */}
      <View style={styles.actionBtnPlaceholder} />
    </Animated.View>
  );
};

export const SearchSkeletonList: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, idx) => (
        <SearchSkeletonItem key={`skeleton-${idx}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.08)",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2ECE5",
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  titlePlaceholder: {
    width: "55%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D8E6DC",
  },
  subtitlePlaceholder: {
    width: "75%",
    height: 11,
    borderRadius: 6,
    backgroundColor: "#E8F0EA",
  },
  actionBtnPlaceholder: {
    width: 76,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2ECE5",
  },
});
