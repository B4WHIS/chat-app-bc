import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const InboxScreen = () => {
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F4FED2"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Image
          source={require("../../../assets/images/Logo.png")}
          style={styles.logo}
        />

        {/* MaskedView giúp tô màu Gradient cho chữ */}
        <MaskedView
          maskElement={<Text style={styles.gradientText}>bcchatting</Text>}
        >
          <LinearGradient
            colors={["#204E39", "#4AB476"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {/* Thẻ Text này làm nền trong suốt để kéo dãn kích thước LinearGradient */}
            <Text style={[styles.gradientText, { opacity: 0 }]}>
              bcchatting
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 8,
  },
  gradientText: {
    fontSize: 24, // Theo thiết kế Figma
    fontWeight: "bold",
  },
});

export default InboxScreen;
