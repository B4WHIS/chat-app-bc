import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMessage } from "../types";

const CACHE_PREFIX = "@chat_messages_";
const MAX_CACHE_COUNT = 30;

/**
 * Lấy danh sách tin nhắn được lưu đệm cục bộ từ AsyncStorage (TASK-C4.2)
 */
export const getCachedMessages = async (
  conversationId: string
): Promise<IMessage[]> => {
  if (!conversationId) return [];

  try {
    const rawData = await AsyncStorage.getItem(`${CACHE_PREFIX}${conversationId}`);
    if (!rawData) return [];

    const parsed: IMessage[] = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Lỗi đọc cache tin nhắn AsyncStorage:", error);
    return [];
  }
};

/**
 * Lưu danh sách tin nhắn gần nhất vào AsyncStorage (TASK-C4.2)
 */
export const setCachedMessages = async (
  conversationId: string,
  messages: IMessage[]
): Promise<void> => {
  if (!conversationId || !Array.isArray(messages) || messages.length === 0) return;

  try {
    // Chỉ lưu tối đa MAX_CACHE_COUNT tin nhắn mới nhất để tối ưu dung lượng bộ nhớ
    const toCache = messages.slice(0, MAX_CACHE_COUNT);
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${conversationId}`,
      JSON.stringify(toCache)
    );
  } catch (error) {
    console.warn("Lỗi ghi cache tin nhắn AsyncStorage:", error);
  }
};
