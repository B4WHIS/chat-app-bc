/**
 * Dịch vụ Lưu trữ & Tải ảnh Cloudinary
 * Miễn phí 100%, không cần thẻ thanh toán, hỗ trợ tối ưu ảnh mượt mà cho React Native / Expo
 */

export const CLOUDINARY_CONFIG = {
  cloudName: "tbihmgmc",
  uploadPreset: "chat_app",
};

/**
 * Upload ảnh lên Cloudinary bằng Unsigned Upload Preset
 * @param uri Đường dẫn ảnh cục bộ trên thiết bị
 * @param folder Thư mục lưu trữ trên Cloudinary
 * @returns Đường dẫn HTTPS ảnh (secure_url)
 */
export const uploadToCloudinary = async (
  uri: string,
  folder: string = "chat_images"
): Promise<string> => {
  try {
    const data = new FormData();

    const filename = uri.split("/").pop() || `upload_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    // Format file chuẩn cho React Native FormData
    data.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    data.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Lỗi phản hồi từ Cloudinary:", errorData);
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
  uri: string,
  conversationId: string
): Promise<string> => {
  return uploadToCloudinary(uri, `chat_images/${conversationId}`);
};

/**
 * Upload ảnh đại diện người dùng vào thư mục avatars/{userId}
 */
export const uploadAvatarImage = async (
  uri: string,
  userId: string
): Promise<string> => {
  return uploadToCloudinary(uri, `avatars/${userId}`);
};
