import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { signUpWithEmail } from "../../services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const RegisterScreen = ({ navigation }: any) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const handleRegister = async () => {
    if (!email || !pass || !displayName) {
      Alert.alert("Thông báo", "Email và Password không được để trống");
      return;
    }
    if (pass != confirmPassword) {
      Alert.alert("Thông báo", "Password không trùng khớp");
      return;
    }
    try {
      await signUpWithEmail(email, pass, displayName);
      Alert.alert("Thành công", "Đăng ký tài khoản thành công");
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
          Tạo tài khoản
          <Text style={styles.highlightText}> của bạn</Text>
        </Text>
        <Text style={styles.subTitle}>Tạo tài của bạn để bắt đầu</Text>
        <Image
          source={require("../../../assets/images/Register.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />

        {/* Displayname */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Tên hiển thị"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
            style={styles.inputField}
          />
        </View>
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
        {/* confirm pass */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>ĐĂNG KÝ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            style={{
              fontStyle: "italic",
              justifyContent: "center",
              alignSelf: "center",
              marginTop: 20,
            }}
          >
            Đã có tài khoản?
            <Text style={{ color: "#779854" }}> Đăng nhập ngay</Text>
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
    paddingTop: 50,
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

export default RegisterScreen;
