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
} from "react-native";
import { signUpWithEmail } from "../../services/authService";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";

const RegisterScreen = ({ navigation }: any) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
        <Text style={styles.title}>ĐĂNG KÝ</Text>
        <AppTextInput
          iconName="person"
          placeholder="Username"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
        />

        <AppTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          iconName="email"
        />
        <AppTextInput
          iconName="lock"
          placeholder="Password"
          value={pass}
          onChangeText={setPass}
          secureTextEntry
        />
        <AppTextInput
          iconName="lock-outline"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <AppButton title="Đăng kí" onPress={handleRegister} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Đã có tài khoản? Đăng nhập ngay</Text>
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
    // borderWidth: 1,
  },
  title: {
    fontWeight: "bold",
    justifyContent: "center",
    alignSelf: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    color: "#ca5757",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
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
    backgroundColor: "#f5b1b1",
  },
});

export default RegisterScreen;
