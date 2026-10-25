import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
     
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPickImage}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel="Chọn ảnh"
      >
        <Ionicons name="images-outline" size={24} color="#2D6A4F" />
      </TouchableOpacity>

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

    
      <TouchableOpacity
        style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.8}
        accessibilityLabel="Gửi tin nhắn"
      >
        <Ionicons
          name="send"
          size={18}
          color={canSend ? "#FFFFFF" : "#9CA3AF"}
        />
      </TouchableOpacity>
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
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: "#2D6A4F",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
});

export default ChatInputToolbar;
