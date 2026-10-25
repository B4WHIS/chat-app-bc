import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";

import { Avatar } from "../../components/Avatar";
import { auth } from "../../config/firebase";
import { getUserProfile } from "../../services/userService";
import { IUser } from "../../types";

export const SettingsScreen: React.FC = () => {
  const [profile, setProfile] = React.useState<IUser | null>(null);

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getUserProfile(uid).then((data) => {
      setProfile(data);
    });
  }, []);

  const displayName =
    profile?.displayName ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split("@")[0] ||
    "";
  const email = profile?.email || auth.currentUser?.email || "";
  const avatarUrl = profile?.avatarUrl || auth.currentUser?.photoURL;

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => signOut(auth),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#EAF5EE", "#F6FAF7", "#FFFFFF"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.25 }}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.profileCard}>
          <Avatar
            uri={avatarUrl}
            name={displayName || email}
            size={68}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {displayName}
            </Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Section: Thiết lập ứng dụng */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tài khoản & Ứng dụng</Text>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: "#EBF5EE" }]}>
              <Ionicons name="person-outline" size={20} color="#2D6A4F" />
            </View>
            <Text style={styles.settingLabel}>Hồ sơ cá nhân</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#6366F1"
              />
            </View>
            <Text style={styles.settingLabel}>Bảo mật & Quyền riêng tư</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#D97706"
              />
            </View>
            <Text style={styles.settingLabel}>Thông báo & Âm thanh</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color="#9333EA"
              />
            </View>
            <Text style={styles.settingLabel}>Giao diện & Chủ đề</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Section: Đăng xuất */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutLabel}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
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
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 11,
    color: "#2D6A4F",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.07)",
    shadowColor: "#1B4332",
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
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
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
});

export default SettingsScreen;
