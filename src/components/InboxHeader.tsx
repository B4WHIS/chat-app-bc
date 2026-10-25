import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export type FilterType = "all" | "unread" | "groups" | "pinned";

interface InboxHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalUnreadCount: number;
  onComposePress?: () => void;
  onProfilePress?: () => void;
}

const FilterChip: React.FC<{
  label: string;
  isActive: boolean;
  count?: number;
  onPress: () => void;
}> = ({ label, isActive, count, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[
          styles.chip,
          isActive ? styles.activeChip : styles.inactiveChip,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isActive ? styles.activeChipText : styles.inactiveChipText,
          ]}
        >
          {label}
        </Text>
        {typeof count === "number" && count > 0 && (
          <View
            style={[
              styles.chipBadge,
              isActive ? styles.activeChipBadge : styles.inactiveChipBadge,
            ]}
          >
            <Text
              style={[
                styles.chipBadgeText,
                isActive
                  ? styles.activeChipBadgeText
                  : styles.inactiveChipBadgeText,
              ]}
            >
              {count > 99 ? "99+" : count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalUnreadCount,
  onComposePress,
  onProfilePress,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Title Bar */}
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>Đoạn chat</Text>

        <View style={styles.actionIconsRow}>
          <TouchableOpacity
            style={styles.circleActionBtn}
            onPress={onComposePress}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color="#2D6A4F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Glassmorphic Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Tìm tin nhắn, người liên hệ..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange("")}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <FilterChip
          label="Tất cả"
          isActive={activeFilter === "all"}
          onPress={() => onFilterChange("all")}
        />
        <FilterChip
          label="Chưa đọc"
          isActive={activeFilter === "unread"}
          count={totalUnreadCount}
          onPress={() => onFilterChange("unread")}
        />
        <FilterChip
          label="Đã ghim"
          isActive={activeFilter === "pinned"}
          onPress={() => onFilterChange("pinned")}
        />
        <FilterChip
          label="Nhóm"
          isActive={activeFilter === "groups"}
          onPress={() => onFilterChange("groups")}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  actionIconsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleActionBtn: {
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
    borderRadius: 16,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.08)",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activeChip: {
    backgroundColor: "#2D6A4F",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.12)",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  activeChipText: {
    color: "#FFFFFF",
  },
  inactiveChipText: {
    color: "#4B5563",
  },
  chipBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  activeChipBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  inactiveChipBadge: {
    backgroundColor: "#2D6A4F",
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activeChipBadgeText: {
    color: "#FFFFFF",
  },
  inactiveChipBadgeText: {
    color: "#FFFFFF",
  },
});
