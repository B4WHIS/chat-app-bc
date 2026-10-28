import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 50,
  isOnline,
  showOnlineBadge,
}) => {
  const getInitial = (name?: string) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const borderRadius = size / 2;

  // Tính kích thước chấm online linh hoạt theo size của Avatar
  const badgeSize = Math.max(10, Math.round(size * 0.26));
  const badgeBorderWidth = Math.max(1.5, Math.round(size * 0.04));

  // Hiển thị badge nếu showOnlineBadge=true hoặc isOnline=true
  const shouldShowBadge = showOnlineBadge ?? (isOnline !== undefined && isOnline === true);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius },
          ]}
        >
          <Text style={[styles.initialText, { fontSize: size * 0.4 }]}>
            {getInitial(name)}
          </Text>
        </View>
      )}

      {/* Chấm tròn xanh Online Badge (TASK-C3.1) */}
      {shouldShowBadge && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderWidth: badgeBorderWidth,
              backgroundColor: isOnline === false ? "#9CA3AF" : "#10B981",
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    resizeMode: "cover",
  },
  placeholder: {
    backgroundColor: "#bfe0a0",
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderColor: "#FFFFFF",
    // Hiệu ứng shadow nhẹ cho badge nổi bật
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
});

export default Avatar;
