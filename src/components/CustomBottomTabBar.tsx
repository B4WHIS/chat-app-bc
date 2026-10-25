import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface TabItemConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  Chats: {
    name: "Chats",
    label: "Đoạn chat",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
  },
  People: {
    name: "People",
    label: "Danh bạ",
    activeIcon: "people",
    inactiveIcon: "people-outline",
  },
  Settings: {
    name: "Settings",
    label: "Cài đặt",
    activeIcon: "settings",
    inactiveIcon: "settings-outline",
  },
};

const TabButton: React.FC<{
  tab: TabItemConfig;
  isFocused: boolean;
  onPress: () => void;
  badgeCount?: number;
}> = ({ tab, isFocused, onPress, badgeCount = 0 }) => {
  const scale = useSharedValue(1);
  const pillScale = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.12, { damping: 10, stiffness: 220 });
      pillScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = withSpring(1, { damping: 12 });
      pillScale.value = withSpring(0, { damping: 14 });
    }
  }, [isFocused, scale, pillScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillScale.value,
    transform: [{ scaleX: pillScale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.tabButton}
    >
      <View style={styles.iconWrapper}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={isFocused ? tab.activeIcon : tab.inactiveIcon}
            size={24}
            color={isFocused ? "#2D6A4F" : "#9CA3AF"}
          />
        </Animated.View>

        {/* Badge cho tin nhắn chưa đọc (nếu có) */}
        {tab.name === "Chats" && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.tabLabel,
          isFocused ? styles.activeLabel : styles.inactiveLabel,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>

      {/* Morphing indicator bên dưới icon đang chọn */}
      <Animated.View style={[styles.activePillIndicator, animatedPillStyle]} />
    </TouchableOpacity>
  );
};

export const CustomBottomTabBar: React.FC<
  BottomTabBarProps & { unreadCount?: number }
> = ({ state, descriptors, navigation, unreadCount = 0 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            name: route.name,
            label: options.title || route.name,
            activeIcon: "ellipse",
            inactiveIcon: "ellipse-outline",
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              tab={config}
              isFocused={isFocused}
              onPress={onPress}
              badgeCount={route.name === "Chats" ? unreadCount : 0}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 18,
    right: 18,
    backgroundColor: "transparent",
  },
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    height: 64,
    borderRadius: 28,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.1)",
    // Subtle luxury drop shadow
    shadowColor: "#1B4332",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  activeLabel: {
    color: "#2D6A4F",
    fontWeight: "700",
  },
  inactiveLabel: {
    color: "#9CA3AF",
    fontWeight: "500",
  },
  activePillIndicator: {
    position: "absolute",
    bottom: 4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2D6A4F",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#EF4444",
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
});

export default CustomBottomTabBar;
