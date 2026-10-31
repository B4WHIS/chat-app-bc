import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  TextInputInstance,
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

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signUpWithEmail } from "../../services/authService";
import { AuthStackParamList } from "../../types";

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}
import AppButton from "../../components/AppButton";
import AuthInputField from "../../components/AuthInputField";
import LoadingOverlay from "../../components/LoadingOverlay";

const getFriendlyAuthErrorMessage = (error: unknown): string => {
  if (!error) return "Đã xảy ra lỗi, vui lòng thử lại sau.";
  const err = error as { code?: string; message?: string };
  const rawMsg = err.message || "";
  const code = err.code || "";
  const errStr = `${code} ${rawMsg}`.toLowerCase();

  if (
    errStr.includes("auth/invalid-credential") ||
    errStr.includes("auth/wrong-password")
  ) {
    return "Email hoặc mật khẩu không chính xác";
  }
  if (errStr.includes("auth/user-not-found")) {
    return "Tài khoản không tồn tại";
  }
  if (errStr.includes("auth/email-already-in-use")) {
    return "Email này đã được đăng ký";
  }
  if (errStr.includes("auth/weak-password")) {
    return "Mật khẩu quá yếu (tối thiểu 6 ký tự)";
  }
  if (errStr.includes("auth/network-request-failed")) {
    return "Lỗi kết nối mạng, vui lòng kiểm tra lại";
  }
  if (errStr.includes("auth/invalid-email")) {
    return "Định dạng email không hợp lệ";
  }
  if (errStr.includes("auth/too-many-requests")) {
    return "Bạn đã thao tác sai quá nhiều lần. Vui lòng đợi trong giây lát!";
  }
  if (errStr.includes("auth/user-disabled")) {
    return "Tài khoản này đã bị tạm khóa";
  }

  if (rawMsg && !rawMsg.includes("auth/") && !rawMsg.includes("Firebase")) {
    return rawMsg;
  }

  return "Đã xảy ra lỗi, vui lòng thử lại sau.";
};

const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (password.length < 6) {
    return "Mật khẩu phải chứa ít nhất 6 ký tự.";
  }
  if (!/[a-z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).";
  }
  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).";
  }
  if (!/\d/.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 chữ số (0-9).";
  }
  return null;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    pass?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // References for keyboard auto-advance
  const emailRef = useRef<TextInputInstance>(null);
  const passRef = useRef<TextInputInstance>(null);
  const confirmPassRef = useRef<TextInputInstance>(null);

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
    Keyboard.dismiss();
    const newErrors: {
      displayName?: string;
      email?: string;
      pass?: string;
      confirmPassword?: string;
    } = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Vui lòng nhập họ và tên của bạn.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Định dạng email không hợp lệ.";
    }

    const passError = validatePassword(pass);
    if (passError) {
      newErrors.pass = passError;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
    } else if (pass !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không trùng khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setLoading(true);

    try {
      await signUpWithEmail(email.trim(), pass, displayName.trim());
      // Keep loading as true so button spinner continues smoothly until RootNavigator switches screens
    } catch (error: unknown) {
      setLoading(false);
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      const err = error as { code?: string; message?: string };
      const errStr = `${err.code || ""} ${err.message || ""}`.toLowerCase();

      if (errStr.includes("auth/email-already-in-use")) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Email này đã được đăng ký tài khoản.",
        }));
      } else if (errStr.includes("auth/weak-password")) {
        setFieldErrors((prev) => ({
          ...prev,
          pass: "Mật khẩu quá yếu (tối thiểu 6 ký tự gồm cả chữ hoa, thường và số).",
        }));
      } else {
        setFormError(friendlyMsg);
      }
    }
  };

  // Tạm ẩn tính năng Google Sign-In theo yêu cầu TASK-B5.1
  /*
  const handleGoogleSignIn = () => {
    // Không dùng Alert.alert
  };
  */

  const isPasswordMatched = Boolean(
    confirmPassword &&
      pass &&
      confirmPassword === pass &&
      validatePassword(pass) === null
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
                {/* Error Banner nếu có lỗi từ hệ thống */}
                {Boolean(formError) && (
                  <View style={styles.formErrorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#DC2626" style={styles.formErrorIcon} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                )}

                {/* Display Name */}
                <AuthInputField
                  icon="person-outline"
                  placeholder="Họ và tên hiển thị..."
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    if (fieldErrors.displayName) {
                      setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
                    }
                    if (formError) setFormError(null);
                  }}
                  error={fieldErrors.displayName}
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
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                    if (formError) setFormError(null);
                  }}
                  error={fieldErrors.email}
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
                  placeholder="Mật khẩu (hoa, thường, số, ≥6 ký tự)..."
                  value={pass}
                  onChangeText={(text) => {
                    setPass(text);
                    if (fieldErrors.pass) {
                      setFieldErrors((prev) => ({ ...prev, pass: undefined }));
                    }
                    if (formError) setFormError(null);
                  }}
                  error={fieldErrors.pass}
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
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                    if (formError) setFormError(null);
                  }}
                  error={fieldErrors.confirmPassword}
                  isPassword
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  success={isPasswordMatched}
                />

                {/* Real-time Password Match Feedback */}
                {Boolean(confirmPassword.length > 0 && !fieldErrors.confirmPassword) && (
                  <View style={styles.passwordHintRow}>
                    {isPasswordMatched ? (
                      <Text style={styles.passwordMatchSuccess}>
                        ✓ Mật khẩu xác nhận trùng khớp
                      </Text>
                    ) : confirmPassword === pass && validatePassword(pass) !== null ? (
                      <Text style={styles.passwordMatchError}>
                        Mật khẩu chưa đủ điều kiện (hoa, thường, số, ≥6 ký tự)
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

                {/* Tạm ẩn nút Google Sign-In & Social Divider để giao diện Auth hoạt động 100% tính năng thật Email/Password */}
                {/*
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleBtn}
                  activeOpacity={0.8}
                  onPress={handleGoogleSignIn}
                >
                  <Ionicons name="logo-google" size={19} color="#EA4335" style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Đăng ký với Google</Text>
                </TouchableOpacity>
                */}

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
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  formErrorIcon: {
    marginRight: 8,
  },
  formErrorText: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
    lineHeight: 18,
  },
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
