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

const RootNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
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
