import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";

import {
  SwipeableChatItem,
  ExtendedConversation,
} from "../../components/SwipeableChatItem";
import {
  OnlineStoriesBar,
  IStoryUser,
} from "../../components/OnlineStoriesBar";
import {
  InboxHeader,
  FilterType,
} from "../../components/InboxHeader";
import { auth } from "../../config/firebase";
import {
  subscribeConversations,
  togglePinConversation,
  toggleMuteConversation,
  markConversationAsRead,
  deleteConversation,
  generateConversationId,
  repairMissingConversations,
} from "../../services/conversationService";
import { getSuggestedUsers, getUserProfile } from "../../services/userService";

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<ExtendedConversation>
);

export const InboxScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const currentUserId = auth.currentUser?.uid || "current_user";
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    displayName: string;
    avatarUrl?: string;
  }>({
    displayName:
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split("@")[0] ||
      "Bạn",
    avatarUrl: auth.currentUser?.photoURL || undefined,
  });

  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [onlineStories, setOnlineStories] = useState<IStoryUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Load real profile from Firestore
  useEffect(() => {
    if (auth.currentUser?.uid) {
      getUserProfile(auth.currentUser.uid).then((prof) => {
        if (prof) {
          setCurrentUserProfile({
            displayName:
              prof.displayName ||
              auth.currentUser?.displayName ||
              auth.currentUser?.email?.split("@")[0] ||
              "Bạn",
            avatarUrl:
              prof.avatarUrl || auth.currentUser?.photoURL || undefined,
          });
        }
      });
    }
  }, []);

  // Load real active users from Firestore
  useEffect(() => {
    getSuggestedUsers().then((users) => {
      const mapped: IStoryUser[] = users.map((u) => ({
        id: u.id,
        name: u.displayName || u.email.split("@")[0],
        avatarUrl: u.avatarUrl,
        isOnline: u.isOnline,
        hasStory: false,
      }));
      setOnlineStories(mapped);
    });
  }, []);

  // Real-time subscription to Cloud Firestore conversations
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const currentUid = auth.currentUser.uid;
    repairMissingConversations(currentUid);
    const unsubscribe = subscribeConversations(
      currentUid,
      (firestoreList) => {
        const mapped: ExtendedConversation[] = firestoreList.map((conv) => {
          const partnerId = conv.participantIds?.find(
            (id) => id !== currentUid
          );
          const partner = partnerId
            ? conv.participantsMap?.[partnerId]
            : undefined;

          return {
            ...conv,
            partnerName: partner?.displayName || "Bạn chat",
            partnerAvatar: partner?.avatarUrl,
            isPinned: conv.pinnedBy?.includes(currentUid) || false,
            isMuted: conv.mutedBy?.includes(currentUid) || false,
          };
        });
        setConversations(mapped);
      },
      (error) => {
        console.warn("Lỗi đồng bộ real-time conversations:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // FAB scale animation on scroll
  const fabScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (event.contentOffset.y > 40) {
        fabScale.value = withSpring(0.92);
      } else {
        fabScale.value = withSpring(1);
      }
    },
  });

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conv) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = conv.partnerName?.toLowerCase().includes(q);
          const matchMsg = conv.lastMessageText?.toLowerCase().includes(q);
          if (!matchName && !matchMsg) return false;
        }

        // Category Filter
        if (activeFilter === "unread") {
          const unread = conv.unreadCount?.[currentUserId] || 0;
          return unread > 0;
        }
        if (activeFilter === "pinned") {
          return conv.isPinned === true;
        }
        if (activeFilter === "groups") {
          return (
            conv.partnerName?.includes("Team") ||
            conv.partnerName?.includes("Nhóm")
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned on top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [conversations, searchQuery, activeFilter, currentUserId]);

  // Total unread count
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount?.[currentUserId] || 0);
    }, 0);
  }, [conversations, currentUserId]);

  // Actions
  const handlePin = useCallback(
    (target: ExtendedConversation) => {
      const nextPinned = !target.isPinned;
      // Optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, isPinned: nextPinned } : c
        )
      );

      // Cloud Firestore sync
      if (auth.currentUser?.uid) {
        togglePinConversation(
          target.id,
          auth.currentUser.uid,
          target.isPinned || false
        ).catch((err) => console.warn("Lỗi ghim hội thoại:", err));
      }
    },
    []
  );

  const handleMute = useCallback(
    (target: ExtendedConversation) => {
      const nextMuted = !target.isMuted;
      // Optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, isMuted: nextMuted } : c
        )
      );

      // Cloud Firestore sync
      if (auth.currentUser?.uid) {
        toggleMuteConversation(
          target.id,
          auth.currentUser.uid,
          target.isMuted || false
        ).catch((err) => console.warn("Lỗi tắt thông báo:", err));
      }
    },
    []
  );

  const handleDelete = useCallback((target: ExtendedConversation) => {
    Alert.alert(
      "Xóa cuộc trò chuyện",
      `Bạn có chắc chắn muốn xóa tin nhắn với "${target.partnerName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            // Optimistic update
            setConversations((prev) => prev.filter((c) => c.id !== target.id));
            try {
              await deleteConversation(target.id);
            } catch (err) {
              console.warn("Lỗi xóa hội thoại Firestore:", err);
            }

          },
        },
      ]
    );
  }, []);

  const handleChatPress = useCallback(
    (item: ExtendedConversation) => {
      // Mark as read locally and in Firestore
      setConversations((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, unreadCount: { ...c.unreadCount, [currentUserId]: 0 } }
            : c
        )
      );
      if (auth.currentUser?.uid) {
        markConversationAsRead(item.id, auth.currentUser.uid);
      }

      const partnerId = item.participantIds?.find(
        (id) => id !== currentUserId
      );
      const partner = partnerId
        ? item.participantsMap?.[partnerId]
        : undefined;

      if (navigation?.navigate) {
        navigation.navigate("ChatRoom", {
          conversationId: item.id,
          partnerId,
          partnerName: item.partnerName || partner?.displayName,
          partnerAvatar: item.partnerAvatar || partner?.avatarUrl,
          conversation: item,
        });
      } else {
        Alert.alert("Mở chat", `Bắt đầu trò chuyện với ${item.partnerName}`);
      }
    },
    [navigation, currentUserId]
  );

  const handleComposePress = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate("Search");
    } else {
      Alert.alert("Cuộc trò chuyện mới", "Chọn bạn bè hoặc tạo nhóm mới để bắt đầu chat");
    }
  }, [navigation]);

  const handleStoryPress = useCallback(
    (user: IStoryUser) => {
      const currentUid = auth.currentUser?.uid || "current_user";
      const existingConv = conversations.find((c) =>
        c.participantIds?.includes(user.id)
      );

      const convId =
        existingConv?.id || generateConversationId(currentUid, user.id);

      if (navigation?.navigate) {
        navigation.navigate("ChatRoom", {
          conversationId: convId,
          partnerId: user.id,
          partnerName: user.name,
          partnerAvatar: user.avatarUrl,
          partnerUser: {
            id: user.id,
            email: "",
            displayName: user.name,
            avatarUrl: user.avatarUrl,
            isOnline: user.isOnline,
            createdAt: new Date(),
          },
          conversation: existingConv,
        });
      } else {
        Alert.alert("Mở chat", `Bắt đầu trò chuyện với ${user.name}`);
      }
    },
    [navigation, conversations]
  );

  const renderStoriesAndHeader = useCallback(() => {
    return (
      <View>
        {onlineStories.length > 0 && (
          <OnlineStoriesBar
            currentUser={currentUserProfile}
            stories={onlineStories}
            onAddStoryPress={() =>
              Alert.alert("Story", "Tạo khoảnh khắc mới trong ngày")
            }

            onStoryPress={handleStoryPress}


          />
        )}
        <View style={styles.sectionDividerRow}>
          <Text style={styles.sectionTitle}>
            {activeFilter === "pinned"
              ? "Tin nhắn đã ghim"
              : activeFilter === "unread"
              ? "Chưa đọc"
              : activeFilter === "groups"
              ? "Nhóm chat"
              : "Cuộc trò chuyện"}
          </Text>
          <Text style={styles.conversationCount}>
            {filteredConversations.length} cuộc trò chuyện
          </Text>
        </View>
      </View>
    );
  }, [
    currentUserProfile,
    onlineStories,
    activeFilter,
    filteredConversations.length,
    handleStoryPress,
  ]);

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="chatbubbles-outline" size={40} color="#2D6A4F" />
        </View>
        <Text style={styles.emptyTitle}>
          {searchQuery
            ? "Không tìm thấy kết quả"
            : "Chưa có cuộc trò chuyện nào"}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? "Không tìm thấy kết quả phù hợp với từ khóa của bạn."
            : "Bắt đầu kết nối và trò chuyện cùng bạn bè ngay hôm nay!"}
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.emptyCtaBtn}
            onPress={handleComposePress}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
            <Text style={styles.emptyCtaBtnText}>Tìm bạn bè ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Botanical Glassmorphic Gradient Backdrop */}
      <LinearGradient
        colors={["#EAF5EE", "#F6FAF7", "#FFFFFF"]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
      />

      {/* Header đặt ngoài FlatList để không bị unmount/mất focus khi gõ tìm kiếm */}
      <InboxHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalUnreadCount={totalUnreadCount}
        onComposePress={handleComposePress}
      />

      <AnimatedFlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
            <SwipeableChatItem
              conversation={item}
              currentUserId={currentUserId}
              onPress={handleChatPress}
              onPin={handlePin}
              onMute={handleMute}
              onDelete={handleDelete}
            />
          </Animated.View>
        )}
        ListHeaderComponent={renderStoriesAndHeader}
        ListEmptyComponent={renderEmptyComponent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D6A4F"
            colors={["#2D6A4F", "#52B788"]}
          />
        }
      />

      {/* Floating Action Button (New Chat) */}
      <Animated.View style={[styles.fabContainer, animatedFabStyle]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleComposePress}
          style={styles.fabButton}
        >
          <LinearGradient
            colors={["#3B7A59", "#2D6A4F"]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    height: 280,
  },
  listContent: {
    paddingBottom: 110,
  },
  sectionDividerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D6A4F",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  conversationCount: {
    fontSize: 12,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 16,
  },
  emptyCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D6A4F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 8,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCtaBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 96 : 88,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "transparent",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InboxScreen;
