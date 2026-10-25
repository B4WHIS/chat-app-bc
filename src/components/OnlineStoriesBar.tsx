import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Avatar } from "./Avatar";

export interface IStoryUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  hasStory: boolean;
  hasUnseenStory?: boolean;
}

interface OnlineStoriesBarProps {
  currentUser?: { displayName?: string; avatarUrl?: string };
  stories: IStoryUser[];
  onAddStoryPress?: () => void;
  onStoryPress?: (user: IStoryUser) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StoryItem: React.FC<{
  user: IStoryUser;
  onPress?: () => void;
}> = ({ user, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 220 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.storyItem, animatedStyle]}
    >
      <View style={styles.avatarRingWrapper}>
        {user.hasStory ? (
          <LinearGradient
            colors={
              user.hasUnseenStory
                ? ["#52B788", "#2D6A4F", "#B7E4C7"]
                : ["#D1D5DB", "#E5E7EB"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyGradientRing}
          >
            <View style={styles.avatarInnerContainer}>
              <Avatar uri={user.avatarUrl} name={user.name} size={54} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.simpleAvatarContainer}>
            <Avatar uri={user.avatarUrl} name={user.name} size={56} />
          </View>
        )}

        {/* Online Indicator */}
        {user.isOnline && <View style={styles.onlineBadge} />}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {user.name.split(" ").slice(-1)[0]}
      </Text>
    </AnimatedPressable>
  );
};

export const OnlineStoriesBar: React.FC<OnlineStoriesBarProps> = ({
  currentUser,
  stories,
  onAddStoryPress,
  onStoryPress,
}) => {
  const addScale = useSharedValue(1);

  const addAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Story / Add Story button */}
        <AnimatedPressable
          onPress={onAddStoryPress}
          onPressIn={() => {
            addScale.value = withSpring(0.92, { damping: 12, stiffness: 220 });
          }}
          onPressOut={() => {
            addScale.value = withSpring(1, { damping: 14, stiffness: 200 });
          }}
          style={[styles.storyItem, addAnimatedStyle]}
        >
          <View style={styles.avatarRingWrapper}>
            <View style={styles.myStoryContainer}>
              <Avatar
                uri={currentUser?.avatarUrl}
                name={currentUser?.displayName || "Bạn"}
                size={54}
              />
              <View style={styles.addStoryBadge}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Text style={styles.myStoryLabel} numberOfLines={1}>
            Tin của bạn
          </Text>
        </AnimatedPressable>

        {/* Online Friends / Stories */}
        {stories.map((user) => (
          <StoryItem
            key={user.id}
            user={user}
            onPress={() => onStoryPress && onStoryPress(user)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    width: 66,
  },
  avatarRingWrapper: {
    position: "relative",
  },
  storyGradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 2,
  },
  simpleAvatarContainer: {
    padding: 2,
  },
  myStoryContainer: {
    position: "relative",
    padding: 2,
  },
  addStoryBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: "#2D6A4F",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  storyName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#2C3E50",
    textAlign: "center",
  },
  myStoryLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#2D6A4F",
    textAlign: "center",
  },
});
