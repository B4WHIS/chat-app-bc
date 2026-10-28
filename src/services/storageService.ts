/**
 * Dịch vụ Lưu trữ & Tải ảnh Cloudinary
 * Sử dụng Base64 Data URI qua JSON REST API để tránh lỗi 'Unsupported FormDataPart implementation' trên React Native (iOS/Android)
 */

export const CLOUDINARY_CONFIG = {
  cloudName: "tbihmgmc",
  uploadPreset: "chat_app",
};

/**
 * Chuyển local URI thành Base64 Data URI nếu cần
 */
const convertUriToDataUri = async (uri: string): Promise<string> => {
  if (uri.startsWith("data:")) return uri;

  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error("Không thể chuyển đổi file ảnh sang Base64"));
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Upload ảnh lên Cloudinary
 * @param source Đường dẫn ảnh (local URI, Base64 string hoặc Data URI)
 * @param folder Thư mục lưu trữ trên Cloudinary
 * @returns Đường dẫn HTTPS ảnh (secure_url)
 */
export const uploadToCloudinary = async (
  source: string,
  folder: string = "chat_images"
): Promise<string> => {
  try {
    let filePayload: string;

    if (source.startsWith("data:")) {
      filePayload = source;
    } else if (source.startsWith("http://") || source.startsWith("https://")) {
      filePayload = source;
    } else if (
      !source.includes("/") &&
      !source.includes("\\") &&
      source.length > 200
    ) {
      // Chuỗi raw base64
      filePayload = `data:image/jpeg;base64,${source}`;
    } else {
      // Local URI (file://, ph://, content://) -> chuyển thành Data URI an toàn
      filePayload = await convertUriToDataUri(source);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          file: filePayload,
          upload_preset: CLOUDINARY_CONFIG.uploadPreset,
          folder: folder,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Lỗi phản hồi từ Cloudinary API:", errorData);
      throw new Error(
        errorData.error?.message || "Không thể tải ảnh lên Cloudinary"
      );
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error("Lỗi uploadToCloudinary:", error);
    throw error;
  }
};

/**
 * Upload ảnh tin nhắn vào thư mục chat_images/{conversationId}
 */
export const uploadChatImage = async (
  source: string,
  conversationId: string
): Promise<string> => {
  return uploadToCloudinary(source, `chat_images/${conversationId}`);
};

/**
 * Upload ảnh đại diện người dùng vào thư mục avatars/{userId}
 */
export const uploadAvatarImage = async (
  source: string,
  userId: string
): Promise<string> => {
  return uploadToCloudinary(source, `avatars/${userId}`);
};
