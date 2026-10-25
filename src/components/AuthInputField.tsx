import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import {
  View,
  TextInput,
  TextInputInstance,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInputProps,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface AuthInputFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
  success?: boolean;
  rightElement?: React.ReactNode;
}

export const AuthInputField = forwardRef<TextInputInstance, AuthInputFieldProps>(
  (
    {
      icon,
      isPassword = false,
      error,
      success = false,
      rightElement,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const innerInputRef = useRef<TextInputInstance>(null);

    useImperativeHandle(ref, () => innerInputRef.current as TextInputInstance);

    const scale = useSharedValue(1);

    const handleFocus: NonNullable<TextInputProps["onFocus"]> = (e) => {
      setIsFocused(true);
      scale.value = withSpring(1.015, { damping: 14, stiffness: 220 });
      onFocus?.(e);
    };

    const handleBlur: NonNullable<TextInputProps["onBlur"]> = (e) => {
      setIsFocused(false);
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      onBlur?.(e);
    };

    const handlePressContainer = () => {
      innerInputRef.current?.focus();
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <View style={styles.wrapper}>
        <Pressable onPress={handlePressContainer}>
          <Animated.View
            style={[
              styles.container,
              isFocused ? styles.focusedContainer : styles.unfocusedContainer,
              Boolean(error) && styles.errorContainer,
              animatedContainerStyle,
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={isFocused ? "#2D6A4F" : error ? "#EF4444" : "#9CA3AF"}
              style={styles.leadingIcon}
            />

            <TextInput
              ref={innerInputRef}
              style={[styles.input, style]}
              placeholderTextColor="#9CA3AF"
              secureTextEntry={isPassword && !showPassword}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />

            {isPassword ? (
              <View style={styles.rightCluster}>
                {success && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#2D6A4F"
                    style={styles.successIcon}
                  />
                )}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={isFocused ? "#2D6A4F" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>
            ) : rightElement ? (
              rightElement
            ) : success ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#2D6A4F"
                style={styles.successIcon}
              />
            ) : null}
          </Animated.View>
        </Pressable>

        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  unfocusedContainer: {
    backgroundColor: "#F6FAF7",
    borderColor: "rgba(45, 106, 79, 0.12)",
  },
  focusedContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#2D6A4F",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  errorContainer: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
  },
  successIcon: {
    marginRight: 6,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 14,
    fontWeight: "500",
  },
});

export default AuthInputField;
