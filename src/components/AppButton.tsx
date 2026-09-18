import React from "react";
import { Text, StyleSheet, Pressable } from "react-native";

interface AppButtonProps {
  title?: string;
  onPress?: () => void;
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      {({ pressed }) => (
        <Text style={[styles.title, pressed && styles.titlePressed]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#d9fdc1",
    borderColor: "#000000",
    borderWidth: 1,
    alignItems: "center",
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 100,
    marginTop: 15,
    marginBottom: 5,
    padding: 10,
  },
  buttonPressed: {
    backgroundColor: "#3e5e29",
    opacity: 0.8,
  },
  title: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "Sans-Serif",
    fontWeight: "bold",
  },

  titlePressed: {
    color: "#fffefe",
  },
});

export default AppButton;
