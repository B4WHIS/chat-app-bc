import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import InboxScreen from "../screens/main/InboxScreen";
import PeopleScreen from "../screens/main/PeopleScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import CustomBottomTabBar from "../components/CustomBottomTabBar";
import { auth } from "../config/firebase";
import { subscribeConversations } from "../services/conversationService";

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = subscribeConversations(uid, (convList) => {
      const sum = convList.reduce((acc, conv) => {
        return acc + (conv.unreadCount?.[uid] || 0);
      }, 0);
      setTotalUnread(sum);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomBottomTabBar {...props} unreadCount={totalUnread} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={InboxScreen}
        options={{ title: "Đoạn chat" }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{ title: "Danh bạ" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Cài đặt" }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
