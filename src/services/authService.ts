import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { IUser } from "../types";

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayname: string,
) => {
  try {
    //Tao tai khoan tren auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Cap nhat displayName tren Firebase Auth
    await updateProfile(user, { displayName: displayname });

    //Tao doi tuong theo interface
    const newUser: IUser = {
      id: user.uid,
      email: email.toLowerCase(),
      displayName: displayname,
      isOnline: true,
      createdAt: new Date().toISOString(),
    };

    // ghi vao firestore
    await setDoc(doc(db, "users", user.uid), newUser);
    return newUser;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    if (error.code === "auth/weak-password") {
      throw new Error("Mật khẩu quá yếu (tối thiểu 6 ký tự).");
    }
    throw new Error(`Đăng ký thất bại: ${error.code || error.message}`);
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }
    if (error.code === "auth/user-not-found") {
      throw new Error("Tài khoản không tồn tại. Vui lòng đăng ký tài khoản mới.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    if (error.code === "auth/too-many-requests") {
      throw new Error("Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng đợi trong giây lát!");
    }
    throw new Error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("Không tìm thấy tài khoản với email này.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    throw new Error("Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại!");
  }
};
