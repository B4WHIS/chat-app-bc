import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "../../components/Avatar";
import { subscribeChatContacts } from "../../services/messageService";
import { formatLastSeen, isUserCurrentlyOnline } from "../../services/presenceService";
import { auth } from "../../config/firebase";
import { IUser } from "../../types";

export const PeopleScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [contacts, setContacts] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeChatContacts(
      currentUid,
      (list) => {
        setContacts(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Lỗi subscribeChatContacts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
          filtered.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Tất cả liên hệ ({filtered.length})
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item, index }) => {
          const isOnline = isUserCurrentlyOnline(item.isOnline, item.lastSeen);
          const statusText = isOnline
            ? "Đang hoạt động"
            : formatLastSeen(item.lastSeen);

          return (
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
                  {isOnline && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.infoWrapper}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {item.displayName || "Bạn bè"}
                  </Text>
                  <Text
                    style={[
                      styles.contactStatus,
                      isOnline && styles.onlineStatusText,
                    ]}
                    numberOfLines={1}
                  >
                    {statusText}
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
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D6A4F" />
              <Text style={styles.loadingText}>Đang tải danh bạ...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={38} color="#2D6A4F" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có bạn bè nào</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa từng nhắn tin với ai. Hãy tìm kiếm người dùng mới để bắt đầu trò chuyện!
              </Text>
              <TouchableOpacity
                style={styles.findFriendsBtn}
                onPress={() => navigation?.navigate?.("Search")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.findFriendsBtnText}>Tìm kiếm bạn mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={38} color="#2D6A4F" />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySubtitle}>
                Không tìm thấy ai phù hợp với từ khóa "{search.trim()}".
              </Text>
            </View>
          )
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
  contactStatus: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  onlineStatusText: {
    color: "#10B981",
    fontWeight: "600",
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
  findFriendsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D6A4F",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 20,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  findFriendsBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
});

export default PeopleScreen;
