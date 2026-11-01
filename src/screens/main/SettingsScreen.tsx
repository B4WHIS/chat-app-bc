import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { signOutUser } from "../../services/authService";

import { Avatar } from "../../components/Avatar";
import { auth } from "../../config/firebase";
import {
  getUserProfile,
  subscribeUserProfile,
  updateUserAvatar,
  updateUserDisplayName,
  updateOnlinePrivacyStatus,
} from "../../services/userService";
import { uploadAvatarImage } from "../../services/storageService";
import {
  getNotificationSettings,
  updateNotificationSettings,
  INotificationSettings,
} from "../../services/notificationService";
import { useTheme } from "../../context/ThemeContext";
import { IUser } from "../../types";

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, colors, setTheme } = useTheme();

  const [profile, setProfile] = React.useState<IUser | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState<boolean>(false);

  // Modal Hồ sơ cá nhân (Mục 1)
  const [isEditModalVisible, setIsEditModalVisible] = React.useState<boolean>(false);
  const [editNameInput, setEditNameInput] = React.useState<string>("");
  const [savingName, setSavingName] = React.useState<boolean>(false);

  // Modal Bảo mật & Quyền riêng tư (Mục 2)
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = React.useState<boolean>(false);
  const [togglingPrivacy, setTogglingPrivacy] = React.useState<boolean>(false);

  // Modal Thông báo & Âm thanh (Mục 3)
  const [isNotificationModalVisible, setIsNotificationModalVisible] = React.useState<boolean>(false);
  const [notificationSettings, setNotificationSettings] = React.useState<INotificationSettings>({
    notificationsEnabled: true,
    soundEnabled: true,
  });
  const [togglingNotification, setTogglingNotification] = React.useState<boolean>(false);

  // Modal Giao diện & Chủ đề (Mục 4)
  const [isThemeModalVisible, setIsThemeModalVisible] = React.useState<boolean>(false);

  // Lắng nghe dữ liệu profile theo thời gian thực (Real-time, không mockup)
  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Lấy dữ liệu khởi tạo
    getUserProfile(uid).then((data) => {
      if (data) {
        setProfile(data);
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
      }
    });

    // Lấy cấu hình thông báo & âm thanh cục bộ
    getNotificationSettings().then((settings) => {
      setNotificationSettings(settings);
    });

    // Lắng nghe thay đổi liên tục từ Firestore
    const unsubscribe = subscribeUserProfile(uid, (data) => {
      if (data) {
        setProfile(data);
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const displayName =
    profile?.displayName ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split("@")[0] ||
    "";
  const email = profile?.email || auth.currentUser?.email || "";
  const avatarUrl = profile?.avatarUrl || auth.currentUser?.photoURL;
  const showOnlineStatus = profile?.showOnlineStatus !== false;
  const isOnline = showOnlineStatus && profile?.isOnline !== false;

  const handlePickAndChangeAvatar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại để cập nhật ảnh đại diện.");
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      const localUri = selectedAsset.uri;
      const imagePayload = selectedAsset.base64
        ? `data:image/jpeg;base64,${selectedAsset.base64}`
        : localUri;

      setUploadingAvatar(true);

      // Upload ảnh đại diện lên Cloudinary (TASK-B3.3)
      const downloadUrl = await uploadAvatarImage(imagePayload, uid);

      // Cập nhật Auth & Firestore (TASK-B3.3)
      await updateUserAvatar(uid, downloadUrl);

      // Cập nhật state hiển thị ngay tức thì
      setProfile((prev) => (prev ? { ...prev, avatarUrl: downloadUrl } : null));

      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện mới! 🎉");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Lỗi cập nhật avatar:", msg);
      Alert.alert("Lỗi cập nhật avatar", msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditNameInput(displayName);
    setIsEditModalVisible(true);
  };

  const handleSaveDisplayName = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const trimmed = editNameInput.trim();
    if (!trimmed) {
      Alert.alert("Thông báo", "Tên hiển thị không được để trống.");
      return;
    }

    if (trimmed === displayName) {
      setIsEditModalVisible(false);
      return;
    }

    setSavingName(true);
    try {
      await updateUserDisplayName(uid, trimmed);
      setProfile((prev) => (prev ? { ...prev, displayName: trimmed } : null));
      setIsEditModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật tên hiển thị! 🎉");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Lỗi cập nhật tên:", msg);
      Alert.alert("Lỗi", msg);
    } finally {
      setSavingName(false);
    }
  };

  // Xử lý bật/tắt hiển thị trạng thái online (Mục 2)
  const handleToggleOnlineStatus = async (value: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setTogglingPrivacy(true);
    try {
      await updateOnlinePrivacyStatus(uid, value);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              showOnlineStatus: value,
              isOnline: value,
            }
          : null
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Lỗi bật/tắt trạng thái online:", msg);
      Alert.alert("Lỗi", "Không thể cập nhật quyền riêng tư: " + msg);
    } finally {
      setTogglingPrivacy(false);
    }
  };

  // Xử lý bật/tắt nhận thông báo đẩy (Mục 3)
  const handleToggleNotifications = async (val: boolean) => {
    const uid = auth.currentUser?.uid || "";
    setTogglingNotification(true);
    try {
      const updated = await updateNotificationSettings(uid, {
        notificationsEnabled: val,
      });
      setNotificationSettings(updated);
    } catch (error: unknown) {
      console.warn("Lỗi lưu cấu hình thông báo:", error);
    } finally {
      setTogglingNotification(false);
    }
  };

  // Xử lý bật/tắt âm thanh chuông báo (Mục 3)
  const handleToggleSound = async (val: boolean) => {
    const uid = auth.currentUser?.uid || "";
    setTogglingNotification(true);
    try {
      const updated = await updateNotificationSettings(uid, {
        soundEnabled: val,
      });
      setNotificationSettings(updated);
    } catch (error: unknown) {
      console.warn("Lỗi lưu cấu hình âm thanh:", error);
    } finally {
      setTogglingNotification(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => signOutUser(),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={colors.gradient}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cài đặt</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: isDark ? "#000000" : "#1B4332",
            },
          ]}
          onPress={handleOpenEditModal}
          activeOpacity={0.85}
        >
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handlePickAndChangeAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            accessibilityLabel="Đổi ảnh đại diện"
          >
            <Avatar
              uri={avatarUrl}
              name={displayName || email}
              size={68}
            />
            {uploadingAvatar ? (
              <View style={styles.avatarLoadingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.subtext }]}>
              {email}
            </Text>
            <View
              style={[
                styles.statusBadge,
                !isOnline && (isDark ? styles.statusBadgeOfflineDark : styles.statusBadgeOffline),
              ]}
            >
              <View
                style={[
                  styles.onlineDot,
                  !isOnline && styles.onlineDotOffline,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  !isOnline && styles.statusTextOffline,
                ]}
              >
                {isOnline
                  ? "Đang hoạt động"
                  : !showOnlineStatus
                  ? "Ngoại tuyến (Đã ẩn)"
                  : "Ngoại tuyến"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section: Thiết lập ứng dụng */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: isDark ? "#000000" : "#1B4332",
            },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: colors.primary }]}>
            Tài khoản & Ứng dụng
          </Text>

          {/* Mục 1: Hồ sơ cá nhân */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={handleOpenEditModal}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#1E3A2F" : "#EBF5EE" }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Hồ sơ cá nhân</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Mục 2: Bảo mật & Quyền riêng tư */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsPrivacyModalVisible(true)}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#28294B" : "#EEF2FF" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={isDark ? "#818CF8" : "#6366F1"}
              />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Bảo mật & Quyền riêng tư
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Mục 3: Thông báo & Âm thanh */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsNotificationModalVisible(true)}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#3A331E" : "#FEF3C7" }]}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={isDark ? "#FBBF24" : "#D97706"}
              />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Thông báo & Âm thanh
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Mục 4: Giao diện & Chủ đề */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsThemeModalVisible(true)}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#361E42" : "#F3E8FF" }]}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={isDark ? "#C084FC" : "#9333EA"}
              />
            </View>
            <View style={styles.settingRowText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Giao diện & Chủ đề
              </Text>
              <Text style={[styles.settingBadgeText, { color: colors.subtext }]}>
                {theme === "dark" ? "Tối" : "Sáng"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Section: Đăng xuất */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: isDark ? "#000000" : "#1B4332",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#3B1E1E" : "#FEE2E2" }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutLabel}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Chỉnh sửa Hồ sơ cá nhân (Mục 1) */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}
            onPress={() => setIsEditModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Hồ sơ cá nhân</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity
                style={styles.modalAvatarButton}
                onPress={handlePickAndChangeAvatar}
                disabled={uploadingAvatar}
                activeOpacity={0.8}
              >
                <Avatar
                  uri={avatarUrl}
                  name={displayName || email}
                  size={84}
                />
                <View style={styles.modalCameraBadge}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHintText, { color: colors.subtext }]}>
                {uploadingAvatar ? "Đang tải ảnh lên..." : "Chạm vào ảnh để đổi avatar"}
              </Text>
            </View>

            {/* Input Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tên hiển thị</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={editNameInput}
                  onChangeText={setEditNameInput}
                  placeholder="Nhập tên của bạn..."
                  placeholderTextColor={colors.subtext}
                  maxLength={40}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Input Email (Readonly) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email tài khoản</Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.inputDisabled,
                  {
                    backgroundColor: isDark ? "#283548" : "#F3F4F6",
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.subtext}
                  style={styles.inputIcon}
                />
                <Text style={[styles.textInputDisabled, { color: colors.subtext }]}>{email}</Text>
              </View>
              <Text style={[styles.inputHint, { color: colors.subtext }]}>
                Email cố định theo tài khoản đăng ký
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: isDark ? "#374151" : "#F3F4F6" }]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={savingName || uploadingAvatar}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  (savingName || uploadingAvatar) && styles.saveBtnDisabled,
                ]}
                onPress={handleSaveDisplayName}
                disabled={savingName || uploadingAvatar}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Bảo mật & Quyền riêng tư (Mục 2) */}
      <Modal
        visible={isPrivacyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}
            onPress={() => setIsPrivacyModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Bảo mật & Quyền riêng tư
              </Text>
              <TouchableOpacity
                onPress={() => setIsPrivacyModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Option: Trạng thái hoạt động */}
            <View style={[styles.privacyOptionRow, { borderBottomColor: colors.divider }]}>
              <View style={styles.privacyOptionInfo}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? "#1E3A2F" : "#EBF5EE" }]}>
                  <Ionicons name="radio-button-on-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.privacyOptionTexts}>
                  <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                    Hiển thị trạng thái hoạt động
                  </Text>
                  <Text style={[styles.privacyOptionDesc, { color: colors.subtext }]}>
                    {showOnlineStatus
                      ? "Bạn bè thấy khi bạn trực tuyến"
                      : "Bạn đang ẩn trạng thái hoạt động"}
                  </Text>
                </View>
              </View>

              <Switch
                value={showOnlineStatus}
                onValueChange={handleToggleOnlineStatus}
                disabled={togglingPrivacy}
                trackColor={{ false: "#D1D5DB", true: "#52B788" }}
                thumbColor={showOnlineStatus ? colors.primary : "#F4F3F4"}
              />
            </View>

            {/* Note box */}
            <View
              style={[
                styles.privacyNoteBox,
                { backgroundColor: colors.noteBg, borderColor: colors.inputBorder },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.subtext}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.privacyNoteText, { color: colors.subtext }]}>
                Khi tắt tính năng này, tài khoản của bạn sẽ luôn hiển thị ngoại tuyến trên danh bạ, hộp thư và trong các cuộc trò chuyện của bạn bè.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsPrivacyModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Thông báo & Âm thanh (Mục 3) */}
      <Modal
        visible={isNotificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}
            onPress={() => setIsNotificationModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Thông báo & Âm thanh
              </Text>
              <TouchableOpacity
                onPress={() => setIsNotificationModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Bật/Tắt Thông báo */}
            <View style={[styles.privacyOptionRow, { borderBottomColor: colors.divider }]}>
              <View style={styles.privacyOptionInfo}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? "#3A331E" : "#FEF3C7" }]}>
                  <Ionicons name="notifications-outline" size={20} color={isDark ? "#FBBF24" : "#D97706"} />
                </View>
                <View style={styles.privacyOptionTexts}>
                  <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                    Thông báo tin nhắn
                  </Text>
                  <Text style={[styles.privacyOptionDesc, { color: colors.subtext }]}>
                    {notificationSettings.notificationsEnabled
                      ? "Nhận thông báo khi có tin nhắn mới"
                      : "Đã tắt tất cả thông báo tin nhắn"}
                  </Text>
                </View>
              </View>

              <Switch
                value={notificationSettings.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                disabled={togglingNotification}
                trackColor={{ false: "#D1D5DB", true: "#52B788" }}
                thumbColor={
                  notificationSettings.notificationsEnabled ? colors.primary : "#F4F3F4"
                }
              />
            </View>

            {/* Option 2: Bật/Tắt Âm thanh */}
            <View
              style={[
                styles.privacyOptionRow,
                { borderBottomColor: colors.divider },
                !notificationSettings.notificationsEnabled && { opacity: 0.5 },
              ]}
            >
              <View style={styles.privacyOptionInfo}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? "#28294B" : "#E0E7FF" }]}>
                  <Ionicons
                    name={
                      notificationSettings.soundEnabled
                        ? "volume-high-outline"
                        : "volume-mute-outline"
                    }
                    size={20}
                    color={isDark ? "#818CF8" : "#4F46E5"}
                  />
                </View>
                <View style={styles.privacyOptionTexts}>
                  <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                    Âm thanh thông báo
                  </Text>
                  <Text style={[styles.privacyOptionDesc, { color: colors.subtext }]}>
                    {notificationSettings.soundEnabled
                      ? "Phát âm thanh khi có tin nhắn"
                      : "Tắt chuông thông báo (chỉ rung/hiển thị)"}
                  </Text>
                </View>
              </View>

              <Switch
                value={notificationSettings.soundEnabled}
                onValueChange={handleToggleSound}
                disabled={
                  togglingNotification || !notificationSettings.notificationsEnabled
                }
                trackColor={{ false: "#D1D5DB", true: "#52B788" }}
                thumbColor={
                  notificationSettings.soundEnabled ? colors.primary : "#F4F3F4"
                }
              />
            </View>

            {/* Note box */}
            <View
              style={[
                styles.privacyNoteBox,
                { backgroundColor: colors.noteBg, borderColor: colors.inputBorder },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.subtext}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.privacyNoteText, { color: colors.subtext }]}>
                Cài đặt này áp dụng khi bạn nhận tin nhắn lúc ứng dụng đang chạy nền hoặc đã tắt.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsNotificationModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Giao diện & Chủ đề (Mục 4) */}
      <Modal
        visible={isThemeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsThemeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}
            onPress={() => setIsThemeModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Giao diện & Chủ đề
              </Text>
              <TouchableOpacity
                onPress={() => setIsThemeModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Light Theme */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                theme === "light" && {
                  borderColor: colors.primary,
                  backgroundColor: isDark ? "#1E293B" : "#F0FDF4",
                },
              ]}
              onPress={() => setTheme("light")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="sunny-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.themeOptionTexts}>
                <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                  Chế độ Sáng
                </Text>
                <Text style={[styles.privacyOptionDesc, { color: colors.subtext }]}>
                  Giao diện tươi sáng, hiện đại
                </Text>
              </View>
              {theme === "light" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Option 2: Dark Theme */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                theme === "dark" && {
                  borderColor: colors.primary,
                  backgroundColor: isDark ? "#1E293B" : "#F0FDF4",
                },
              ]}
              onPress={() => setTheme("dark")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: "#312E81" }]}>
                <Ionicons name="moon-outline" size={22} color="#A5B4FC" />
              </View>
              <View style={styles.themeOptionTexts}>
                <Text style={[styles.privacyOptionTitle, { color: colors.text }]}>
                  Chế độ Tối
                </Text>
                <Text style={[styles.privacyOptionDesc, { color: colors.subtext }]}>
                  Tiết kiệm pin và dịu mắt khi trời tối
                </Text>
              </View>
              {theme === "dark" && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsThemeModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 110,
    paddingHorizontal: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarButton: {
    position: "relative",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2D6A4F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarLoadingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(45, 106, 79, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  profileEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 5,
  },
  statusBadgeOffline: {
    backgroundColor: "#F3F4F6",
  },
  statusBadgeOfflineDark: {
    backgroundColor: "#263238",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  onlineDotOffline: {
    backgroundColor: "#9CA3AF",
  },
  statusText: {
    fontSize: 11,
    color: "#2D6A4F",
    fontWeight: "600",
  },
  statusTextOffline: {
    color: "#9CA3AF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.07)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D6A4F",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingRowText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  settingBadgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  logoutItem: {
    paddingVertical: 10,
  },
  logoutLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalAvatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalAvatarButton: {
    position: "relative",
  },
  modalCameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2D6A4F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHintText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: "#F9FAFB",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    paddingVertical: 0,
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  textInputDisabled: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  inputHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginLeft: 2,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#2D6A4F",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Privacy Option Styles (Mục 2 & 3)
  privacyOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  privacyOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  privacyOptionTexts: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  privacyOptionDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  privacyNoteBox: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  privacyNoteText: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
    lineHeight: 17,
  },

  // Theme Option Styles (Mục 4)
  themeOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  themeOptionTexts: {
    flex: 1,
  },
});

export default SettingsScreen;
