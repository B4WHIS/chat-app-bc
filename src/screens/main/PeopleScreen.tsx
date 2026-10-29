import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "../../components/Avatar";
import { getSuggestedUsers } from "../../services/userService";
import { IUser } from "../../types";

export const PeopleScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [contacts, setContacts] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getSuggestedUsers().then(setContacts);
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.displayName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  const handleOpenChat = (user: IUser) => {
    if (navigation?.navigate) {
      navigation.navigate("ChatRoom", {
        partnerId: user.id,
        partnerName: user.displayName,
        partnerAvatar: user.avatarUrl,
        partnerUser: { ...user, createdAt: String(user.createdAt || "") },
      });
    }
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
        <Text style={styles.headerTitle}>Danh bạ</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation?.navigate?.("Search")}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={20} color="#2D6A4F" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={19}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Tìm trong danh bạ..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contacts List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Tất cả liên hệ ({filtered.length})
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenChat(item)}
              style={styles.contactCard}
            >
              <View style={styles.avatarWrapper}>
                <Avatar
                  uri={item.avatarUrl}
                  name={item.displayName || item.email}
                  size={50}
                />
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.infoWrapper}>
                <Text style={styles.contactName} numberOfLines={1}>
                  {item.displayName || "Bạn bè"}
                </Text>
                <Text style={styles.contactEmail} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenChat(item)}
                style={styles.chatIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#2D6A4F"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={38} color="#2D6A4F" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có liên hệ nào</Text>
            <Text style={styles.emptySubtitle}>
              Khi có người dùng đăng ký tài khoản mới, họ sẽ tự động hiển thị ở
              đây.
            </Text>
          </View>
        }
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(45, 106, 79, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F4",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.1)",
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D6A4F",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.07)",
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
  infoWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  contactEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  chatIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(45, 106, 79, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PeopleScreen;
