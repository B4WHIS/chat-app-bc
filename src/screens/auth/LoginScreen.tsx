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
} from "react-native";
import { signInWithEmail } from "../../services/authService";
import AppButton from "../../components/AppButton";
import AppTextInput from "../../components/AppTextInput";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

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
        <Text style={styles.title}>ĐĂNG NHẬP</Text>

        <AppTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          iconName="email"
        />

        <AppTextInput
          placeholder="Password"
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          iconName="lock"
        />

        <AppButton title="Đăng nhập" onPress={handleLogin} />

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text>Chưa có tài khoản? Đăng ký ngay</Text>
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
    //borderWidth: 1,
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

export default LoginScreen;
