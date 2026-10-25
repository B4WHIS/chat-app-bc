import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { IUser } from "../types";

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<IUser> => {
  try {
    // Tao tai khoan tren auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Cap nhat displayName tren Firebase Auth
    await updateProfile(user, { displayName });

    // Tao doi tuong theo interface
    const newUser: IUser = {
      id: user.uid,
      email: email.toLowerCase(),
      displayName: displayName,
      isOnline: true,
      createdAt: new Date().toISOString(),
    };

    // Ghi vao firestore
    await setDoc(doc(db, "users", user.uid), newUser);
    return newUser;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "auth/email-already-in-use") {
      throw new Error(
        "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác."
      );
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    if (err.code === "auth/weak-password") {
      throw new Error("Mật khẩu quá yếu (tối thiểu 6 ký tự).");
    }
    throw new Error(`Đăng ký thất bại: ${err.code || err.message}`);
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user?.uid) {
      await updateDoc(doc(db, "users", userCredential.user.uid), {
        isOnline: true,
      }).catch(() => {
        // Khong chan login neu firestore update chua kip
      });
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password"
    ) {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }
    if (err.code === "auth/user-not-found") {
      throw new Error(
        "Tài khoản không tồn tại. Vui lòng đăng ký tài khoản mới."
      );
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    if (err.code === "auth/too-many-requests") {
      throw new Error(
        "Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng đợi trong giây lát!"
      );
    }
    throw new Error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      await updateDoc(doc(db, "users", currentUid), {
        isOnline: false,
        lastSeen: new Date().toISOString(),
      }).catch(() => {
        // Ignored neu loi ket noi
      });
    }
    await signOut(auth);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    throw new Error(`Đăng xuất thất bại: ${err.message || "Vui lòng thử lại!"}`);
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "auth/user-not-found") {
      throw new Error("Không tìm thấy tài khoản với email này.");
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Định dạng email không hợp lệ.");
    }
    throw new Error(
      "Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại!"
    );
  }
};
