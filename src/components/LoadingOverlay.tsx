import React from "react";
import { StyleSheet, View, Text, Modal, ActivityIndicator } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = "Đang xử lý...",
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          {Boolean(message) && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#2D6A4F",
    textAlign: "center",
  },
});

export default LoadingOverlay;
