import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 50 }) => {
  const getInitial = (name?: string) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[styles.placeholder, { width: size, height: size, borderRadius }]}
    >
      <Text style={[styles.initialText, { fontSize: size * 0.4 }]}>
        {getInitial(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
