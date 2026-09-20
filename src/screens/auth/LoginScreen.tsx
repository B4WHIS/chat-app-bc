import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { signInWithEmail } from "../../services/authService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppButton from "../../components/AppButton";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithEmail(email, pass);
      Alert.alert("Thành công", "Đăng nhập thành công");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={["#bae68a", "#FFFFFF"]}
          style={styles.gradientBg}
        />
        {/* Text giới thiêu */}
        <Text style={styles.titleText}>
          Chào mừng
          <Text style={styles.highlightText}> trở lại!</Text>
        </Text>
        <Text style={styles.subTitle}>
          Đăng nhập để tiếp tục trò chuyện cùng bạn bè
        </Text>
        <Image
          source={require("../../../assets/images/Login.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.inputField}
          />
        </View>
        {/* password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Mật khẩu"
            value={pass}
            onChangeText={setPass}
            secureTextEntry={!showPass}
            style={styles.inputField}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginRight: 12, marginBottom: 12 }}
        >
          <Text style={{ color: "#1d5cd2", fontWeight: "bold" }}>
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>

        <AppButton title="ĐĂNG NHẬP" onPress={handleLogin} />

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text
            style={{
              fontStyle: "italic",
              justifyContent: "center",
              alignSelf: "center",
              marginTop: 20,
            }}
          >
            Chưa có tài khoản?
            <Text style={{ color: "#779854" }}> Đăng ký ngay</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  headerContainer: {
    fontWeight: "bold",
    justifyContent: "center",
    alignSelf: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  titleText: { fontSize: 26, fontWeight: "bold", color: "#2D6A4F" },
  highlightText: { color: "#1F2937" },
  subTitle: { fontSize: 15, color: "#525762", marginTop: 6 },
  heroImage: {
    width: 400,
    height: 250,
    // borderWidth: 1,
    borderRadius: 150,
    // backgroundColor: "#D8F3DC",
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center",
    marginVertical: 24,
  },
  inputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 40,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    justifyContent: "flex-start",
    alignItems: "center",
    height: 50,

    paddingLeft: 10,
    margin: 10,
    paddingHorizontal: 14,
  },
  inputField: {
    flex: 1,
    color: "#9d8f8f",
    paddingLeft: 10,
  },
  button: {
    borderWidth: 1,
    alignItems: "center",
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 100,
    marginTop: 15,
    marginBottom: 5,
    padding: 10,
    backgroundColor: "#bae68a",
    height: 50,
    justifyContent: "center",
  },
});

export default LoginScreen;
