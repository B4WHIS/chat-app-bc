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
  Modal,
  Pressable,
  ActivityIndicator,
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
import { signInWithEmail, resetPassword } from "../../services/authService";
import { AuthStackParamList } from "../../types";

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}
import AppButton from "../../components/AppButton";
import AuthInputField from "../../components/AuthInputField";
import LoadingOverlay from "../../components/LoadingOverlay";

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  // References for keyboard auto-advance
  const passInputRef = useRef<TextInputInstance>(null);

  // Forgot password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Subtle floating animation for Hero illustration
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

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    if (!pass) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), pass);
      // Keep loading as true so button spinner continues smoothly until RootNavigator switches screens
    } catch (error: unknown) {
      const err = error as Error;
      setLoading(false);
      Alert.alert("Đăng nhập thất bại", err.message || "Đã xảy ra lỗi");
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Đăng nhập Google",
      "Tính năng Google Sign-In (OAuth) đang được tích hợp và sẽ khả dụng trong bản cập nhật tới."
    );
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập email tài khoản cần đặt lại mật khẩu.");
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      Alert.alert(
        "Thành công",
        `Liên kết đặt lại mật khẩu đã được gửi tới ${resetEmail.trim()}. Vui lòng kiểm tra hộp thư của bạn.`
      );
      setForgotModalVisible(false);
      setResetEmail("");
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert("Lỗi", err.message || "Đã xảy ra lỗi");
    } finally {
      setResetLoading(false);
    }
  };

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
                  Chào mừng <Text style={styles.highlightText}>trở lại! 👋</Text>
                </Text>
                <Text style={styles.subTitle}>
                  Đăng nhập để tiếp tục trò chuyện cùng bạn bè
                </Text>
              </Animated.View>

              {/* Hero Image with Floating Motion */}
              <Animated.View
                pointerEvents="none"
                entering={FadeInDown.delay(200).duration(450)}
                style={[styles.heroImageWrapper, floatStyle]}
              >
                <Image
                  source={require("../../../assets/images/Login.png")}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Form Fields with Staggered Entrance */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={styles.formContainer}
              >
                {/* Email Field with Auto-advance to Password */}
                <AuthInputField
                  icon="mail-outline"
                  placeholder="Nhập địa chỉ email..."
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passInputRef.current?.focus()}
                  blurOnSubmit={false}
                />

                {/* Password Field with Done submit */}
                <AuthInputField
                  ref={passInputRef}
                  icon="lock-closed-outline"
                  placeholder="Nhập mật khẩu..."
                  value={pass}
                  onChangeText={setPass}
                  isPassword
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                {/* Forgot password */}
                <TouchableOpacity
                  onPress={() => {
                    setResetEmail(email.trim());
                    setForgotModalVisible(true);
                  }}
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <AppButton
                  title="ĐĂNG NHẬP"
                  onPress={handleLogin}
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
                  <Text style={styles.googleBtnText}>Đăng nhập với Google</Text>
                </TouchableOpacity>

                {/* Switch to Register */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  style={styles.switchAuthBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthText}>
                    Chưa có tài khoản?{" "}
                    <Text style={styles.switchAuthHighlight}>Đăng ký ngay</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setForgotModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              onPress={() => setForgotModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <Ionicons name="key-outline" size={32} color="#2D6A4F" />
            </View>

            <Text style={styles.modalTitle}>Quên mật khẩu?</Text>
            <Text style={styles.modalSubtitle}>
              Nhập email tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục
              mật khẩu đến hộp thư.
            </Text>

            <AuthInputField
              icon="mail-outline"
              placeholder="Nhập email tài khoản..."
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.resetSubmitBtn}
              onPress={handleResetPassword}
              disabled={resetLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#3B7A59", "#2D6A4F"]}
                style={styles.resetSubmitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetSubmitText}>Gửi liên kết</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Đang đăng nhập..." />
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  innerTouchable: {
    flex: 1,
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 6,
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
    marginVertical: 14,
  },
  heroImage: {
    width: "100%",
    maxWidth: 320,
    height: 190,
  },
  formContainer: {
    marginTop: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  forgotText: {
    color: "#2D6A4F",
    fontWeight: "700",
    fontSize: 14,
  },
  switchAuthBtn: {
    alignItems: "center",
    marginTop: 18,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  resetSubmitBtn: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    marginTop: 12,
  },
  resetSubmitGradient: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  resetSubmitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default LoginScreen;
