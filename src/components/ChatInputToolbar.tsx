import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "./AppButton";

export interface ChatInputToolbarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSendMessage: (text: string) => void;
  onPickImage?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInputToolbar: React.FC<ChatInputToolbarProps> = ({
  value,
  onChangeText,
  onSendMessage,
  onPickImage,
  placeholder = "Nhập tin nhắn...",
  disabled = false,
}) => {
  const [internalText, setInternalText] = useState<string>("");

  const isControlled = value !== undefined;
  const currentText = isControlled ? value : internalText;

  const handleTextChange = (newText: string) => {
    if (!isControlled) {
      setInternalText(newText);
    }
    onChangeText?.(newText);
  };

  const handleSend = () => {
    const trimmedText = currentText.trim();
    if (!trimmedText || disabled) return;

    onSendMessage(trimmedText);

    if (!isControlled) {
      setInternalText("");
    }
  };

  const canSend = currentText.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      {/* Nút chọn ảnh */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPickImage}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel="Chọn ảnh"
      >
        <Ionicons name="images-outline" size={24} color="#2D6A4F" />
      </TouchableOpacity>

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={currentText}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
      </View>

      {/* Nút gửi tin nhắn AppButton chuẩn theme app */}
      <AppButton
        title="Gửi"
        icon={
          <Ionicons
            name="send"
            size={14}
            color={canSend ? "#FFFFFF" : "#6B7280"}
            style={styles.sendIcon}
          />
        }
        onPress={handleSend}
        disabled={!canSend}
        style={styles.sendAppButton}
        titleStyle={styles.sendAppButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 15,
    color: "#1F2937",
    padding: 0,
    margin: 0,
  },
  sendAppButton: {
    height: 40,
    minWidth: 68,
    borderRadius: 20,
    marginVertical: 0,
    marginLeft: 8,
    marginBottom: 2,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 6,
  },
  sendAppButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sendIcon: {
    marginRight: 4,
  },
});

export default ChatInputToolbar;
