import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { auth } from "../config/firebase";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { setupPresence } from "../services/presenceService";

const RootNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanupPresence: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Kích hoạt hệ thống trạng thái trực tuyến (TASK-C3.1)
      if (currentUser?.uid) {
        if (cleanupPresence) {
          cleanupPresence();
        }
        cleanupPresence = setupPresence(currentUser.uid);
      } else {
        if (cleanupPresence) {
          cleanupPresence();
          cleanupPresence = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({});

export default RootNavigator;
