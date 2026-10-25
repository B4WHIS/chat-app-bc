import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import AppButton from "./src/components/AppButton";
import InboxScreen from "./src/screens/main/InboxScreen";
import ChatRoomScreen from "./src/screens/main/ChatRoomScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatRoomScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
