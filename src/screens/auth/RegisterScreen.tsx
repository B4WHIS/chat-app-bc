import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { signUpWithEmail } from "../../services/authService";
import AppButton from "../../components/AppButton";
import AuthInputField from "../../components/AuthInputField";
import LoadingOverlay from "../../components/LoadingOverlay";

const RegisterScreen = ({ navigation }: any) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // References for keyboard auto-advance
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmPassRef = useRef<TextInput>(null);

  // Floating animation for Hero illustration
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(8, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên hoặc tên hiển thị của bạn.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!pass) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu (tối thiểu 6 ký tự).");
      return;
    }
    if (pass.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }
    if (pass !== confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu xác nhận không trùng khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), pass, displayName.trim());
      // Keep loading as true so button spinner continues smoothly until RootNavigator switches screens
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Đăng ký thất bại", error.message);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Đăng ký với Google",
      "Tính năng Google Sign-In (OAuth) đang được tích hợp và sẽ khả dụng trong bản cập nhật tới."
    );
  };

  const isPasswordMatched = Boolean(
    confirmPassword && pass && confirmPassword === pass && pass.length >= 6
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["#EAF5EE", "#F6FAF7", "#FFFFFF"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.innerTouchable}>
              {/* Header Title */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.headerBlock}
              >
                <Text style={styles.titleText}>
                  Tạo tài khoản <Text style={styles.highlightText}>mới 🌱</Text>
                </Text>
                <Text style={styles.subTitle}>
                  Đăng ký để bắt đầu kết nối và trò chuyện cùng bạn bè
                </Text>
              </Animated.View>

              {/* Hero Illustration with Float Motion */}
              <Animated.View
                pointerEvents="none"
                entering={FadeInDown.delay(180).duration(450)}
                style={[styles.heroImageWrapper, floatStyle]}
              >
                <Image
                  source={require("../../../assets/images/Register.png")}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Form Fields with Staggered Entrance */}
              <Animated.View
                entering={FadeInDown.delay(260).duration(400)}
                style={styles.formContainer}
              >
                {/* Display Name */}
                <AuthInputField
                  icon="person-outline"
                  placeholder="Họ và tên hiển thị..."
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />

                {/* Email */}
                <AuthInputField
                  ref={emailRef}
                  icon="mail-outline"
                  placeholder="Địa chỉ email..."
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  blurOnSubmit={false}
                />

                {/* Password */}
                <AuthInputField
                  ref={passRef}
                  icon="lock-closed-outline"
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)..."
                  value={pass}
                  onChangeText={setPass}
                  isPassword
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPassRef.current?.focus()}
                  blurOnSubmit={false}
                />

                {/* Confirm Password with Live Match Status */}
                <AuthInputField
                  ref={confirmPassRef}
                  icon="shield-checkmark-outline"
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  success={isPasswordMatched}
                />

                {/* Real-time Password Match Feedback */}
                {Boolean(confirmPassword.length > 0) && (
                  <View style={styles.passwordHintRow}>
                    {isPasswordMatched ? (
                      <Text style={styles.passwordMatchSuccess}>
                        ✓ Mật khẩu xác nhận trùng khớp
                      </Text>
                    ) : (
                      <Text style={styles.passwordMatchError}>
                        Mật khẩu xác nhận chưa khớp
                      </Text>
                    )}
                  </View>
                )}

                {/* Register Button */}
                <AppButton
                  title="ĐĂNG KÝ NGAY"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                />

                {/* Social Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  activeOpacity={0.8}
                  onPress={handleGoogleSignIn}
                >
                  <Ionicons name="logo-google" size={19} color="#EA4335" style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Đăng ký với Google</Text>
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.switchAuthBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthText}>
                    Đã có tài khoản?{" "}
                    <Text style={styles.switchAuthHighlight}>Đăng nhập ngay</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Đang tạo tài khoản..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  innerTouchable: {
    flex: 1,
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D6A4F",
    letterSpacing: -0.5,
  },
  highlightText: {
    color: "#1F2937",
  },
  subTitle: {
    fontSize: 15,
    color: "#4B5563",
    marginTop: 6,
    fontWeight: "500",
  },
  heroImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  heroImage: {
    width: "100%",
    maxWidth: 300,
    height: 165,
  },
  formContainer: {
    marginTop: 4,
  },
  switchAuthBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  switchAuthHighlight: {
    color: "#2D6A4F",
    fontWeight: "700",
  },
  // Real-time password feedback
  passwordHintRow: {
    marginTop: 2,
    marginBottom: 6,
    marginLeft: 14,
  },
  passwordMatchSuccess: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D6A4F",
  },
  passwordMatchError: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },
  // Social Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(45, 106, 79, 0.12)",
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(45, 106, 79, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
});

export default RegisterScreen;
