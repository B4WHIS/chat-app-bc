import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { auth } from "../config/firebase";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";

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
        <ActivityIndicator size="large" color="#ec3232" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {user ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Xin chào: {user.email}</Text>
          <TouchableOpacity
            onPress={() => signOut(auth)}
            style={{ backgroundColor: "#ca5757", padding: 12, borderRadius: 8 }}
          >
            Dang xuat
          </TouchableOpacity>
        </View>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({});

export default RootNavigator;
