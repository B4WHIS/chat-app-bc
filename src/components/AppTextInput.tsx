import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
} from "react-native";
// Sử dụng MaterialIcons phổ biến, bạn có thể đổi bộ icon khác
import { MaterialIcons } from "@expo/vector-icons";

interface AppTextInputProps extends TextInputProps {
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  iconName,
  iconColor = "#6e6e73",
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {iconName && (
        <MaterialIcons
          name={iconName}
          size={22}
          color={iconColor}
          style={styles.icon}
        />
      )}

      <TextInput
        style={[
          styles.input,

          iconName ? { paddingLeft: 10 } : { paddingLeft: 15 },
          style,
        ]}
        placeholderTextColor="#8e8e93"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    borderWidth: 1,
    borderColor: "#cde2be",
    borderRadius: 20,
    marginVertical: 10,
    width: "100%",
  },
  icon: {
    paddingLeft: 15,
    color: "#8e8e93",
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    fontSize: 16,
    color: "#000000",
  },
});

export default AppTextInput;
