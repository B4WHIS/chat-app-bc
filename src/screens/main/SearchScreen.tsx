import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputInstance,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";

import { UserSearchItem } from "../../components/UserSearchItem";
import { SearchSkeletonList } from "../../components/SearchSkeleton";
import { Avatar } from "../../components/Avatar";
import { searchUsers, getSuggestedUsers } from "../../services/userService";
import { generateConversationId } from "../../services/conversationService";
import { auth } from "../../config/firebase";
import { IUser } from "../../types";

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<IUser[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Profile Modal State
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const searchInputRef = useRef<TextInputInstance>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load suggested users on mount
  useEffect(() => {
    let isMounted = true;
    getSuggestedUsers().then((users) => {
      if (isMounted) setSuggestedUsers(users);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search handler
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setIsLoading(false);
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      const results = await searchUsers(text);
      setSearchResults(results);
      setIsLoading(false);

      // Add to recent search terms if valid
      if (text.trim().length >= 3) {
        setRecentSearches((prev) => {
          const filtered = prev.filter(
            (item) => item.toLowerCase() !== text.trim().toLowerCase()
          );
          return [text.trim(), ...filtered].slice(0, 6);
        });
      }
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsLoading(false);
    searchInputRef.current?.focus();
  };

  const handleRemoveRecentSearch = (termToRemove: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== termToRemove));
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
  };

  const handleSelectRecentTerm = (term: string) => {
    setSearchTerm(term);
    handleSearchChange(term);
  };

  // View Profile Modal
  const handleViewProfile = useCallback((user: IUser) => {
    Keyboard.dismiss();
    setSelectedUser(user);
    setModalVisible(true);
  }, []);

  // Start Chat Action
  const handleStartChat = useCallback(
    (user: IUser) => {
      setModalVisible(false);
      const currentUid = auth.currentUser?.uid || "current_user";
      const convId = generateConversationId(currentUid, user.id);

      if (navigation?.navigate) {
        navigation.navigate("ChatRoom", {
          conversationId: convId,
          partnerId: user.id,
          partnerName: user.displayName,
          partnerAvatar: user.avatarUrl,
          partnerUser: user,
        });
      } else {
        Alert.alert(
          "Tạo cuộc trò chuyện",
          `Bắt đầu nhắn tin với ${user.displayName || user.email}`
        );
      }
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Botanical Header Background */}
      <LinearGradient
        colors={["#EAF5EE", "#F6FAF7", "#FFFFFF"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.25 }}
      />

      {/* Top Search Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#2D6A4F"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            placeholder="Tìm theo email hoặc tên..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={handleSearchChange}
            style={styles.textInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.sectionTitle}>Đang tìm kiếm...</Text>
          <SearchSkeletonList count={4} />
        </View>
      ) : searchTerm.trim().length > 0 ? (
        /* Results View */
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Kết quả tìm kiếm ({searchResults.length})
            </Text>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 60).duration(300)}
            >
              <UserSearchItem
                user={item}
                onViewProfile={handleViewProfile}
                onStartChat={handleStartChat}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="person-outline" size={38} color="#2D6A4F" />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy người dùng</Text>
              <Text style={styles.emptySubtitle}>
                Không có ai khớp với từ khóa "{searchTerm}". Vui lòng thử tìm
                kiếm bằng địa chỉ email đầy đủ.
              </Text>
            </View>
          }
        />
      ) : (
        /* Default View: Recent Searches + Suggested Friends */
        <FlatList
          data={suggestedUsers}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                    <TouchableOpacity onPress={handleClearAllRecent}>
                      <Text style={styles.clearAllText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.recentChipsContainer}>
                    {recentSearches.map((term) => (
                      <View key={term} style={styles.recentChip}>
                        <TouchableOpacity
                          onPress={() => handleSelectRecentTerm(term)}
                          style={styles.chipTextContainer}
                        >
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#2D6A4F"
                          />
                          <Text style={styles.chipText} numberOfLines={1}>
                            {term}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveRecentSearch(term)}
                          style={styles.chipRemoveBtn}
                        >
                          <Ionicons name="close" size={14} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Suggested Friends Section Header */}
              <View style={styles.suggestedHeaderRow}>
                <Text style={styles.sectionTitle}>Gợi ý kết nối</Text>
                <Text style={styles.suggestedSubtitle}>
                  Bạn bè gần đây & Thành viên mới
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <UserSearchItem
                user={item}
                onViewProfile={handleViewProfile}
                onStartChat={handleStartChat}
              />
            </Animated.View>
          )}
        />
      )}

      {/* User Profile Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close-circle" size={26} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Profile Avatar */}
            <View style={styles.modalAvatarContainer}>
              <Avatar
                uri={selectedUser?.avatarUrl}
                name={selectedUser?.displayName || selectedUser?.email}
                size={84}
              />
              {selectedUser?.isOnline && (
                <View style={styles.modalOnlineDot} />
              )}
            </View>

            {/* Name & Email */}
            <Text style={styles.modalNameText}>
              {selectedUser?.displayName ||
                selectedUser?.email?.split("@")[0] ||
                ""}
            </Text>
            <Text style={styles.modalEmailText}>{selectedUser?.email}</Text>

            {/* Status indicator */}
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: selectedUser?.isOnline
                      ? "#10B981"
                      : "#9CA3AF",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {selectedUser?.isOnline
                  ? "Đang trực tuyến"
                  : "Ngoại tuyến"}
              </Text>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => selectedUser && handleStartChat(selectedUser)}
              style={styles.modalChatBtn}
            >
              <LinearGradient
                colors={["#3B7A59", "#2D6A4F"]}
                style={styles.modalChatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.modalChatBtnText}>Nhắn tin ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(45, 106, 79, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F4",
    paddingHorizontal: 14,
    borderRadius: 20,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.12)",
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  loadingContainer: {
    paddingTop: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D6A4F",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  clearAllText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  recentChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F4",
    borderRadius: 18,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.1)",
  },
  chipTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 160,
  },
  chipText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
  },
  chipRemoveBtn: {
    padding: 3,
    marginLeft: 4,
  },
  suggestedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
    marginBottom: 6,
  },
  suggestedSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  modalAvatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  modalOnlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  modalNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  modalEmailText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F4",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  modalChatBtn: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
  },
  modalChatGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modalChatBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default SearchScreen;
