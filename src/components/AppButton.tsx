import React from "react";
import {
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface AppButtonProps {
  title?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  variant?: "primary" | "secondary" | "outline";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  titleStyle,
  variant = "primary",
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.97, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.pressableWrapper,
        disabled && styles.disabledBtn,
        style,
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={
          disabled
            ? ["#C8D6CE", "#B4C4BC"]
            : variant === "secondary"
            ? ["#E8F5E9", "#D8F3DC"]
            : ["#3B7A59", "#2D6A4F"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "secondary" ? "#2D6A4F" : "#FFFFFF"}
          />
        ) : (
          <Text
            style={[
              styles.title,
              variant === "secondary" && styles.secondaryTitle,
              titleStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    borderRadius: 25,
    marginVertical: 12,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    height: 52,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  disabledBtn: {
    shadowOpacity: 0.05,
    elevation: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryTitle: {
    color: "#2D6A4F",
  },
});

export default AppButton;
