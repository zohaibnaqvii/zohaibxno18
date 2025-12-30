
import { User, Chat, Message } from './types';

const STORAGE_KEY_USER = 'zohaibx_user';
const STORAGE_KEY_CHATS = 'zohaibx_chats';

export const auth = {
  signIn: async (): Promise<User> => {
    // Direct access granted by LEGEND
    const mockUser: User = {
      uid: 'zohaib_legend_user',
      name: 'LEGENDARY USER',
      email: 'access@zohaibxno18.ai',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=Zohaib`,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    return mockUser;
  },
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  },
  signOut: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
};

export const db = {
  getChats: async (uid: string): Promise<Chat[]> => {
    const data = localStorage.getItem(STORAGE_KEY_CHATS);
    const chats: Chat[] = data ? JSON.parse(data) : [];
    return chats.filter(c => c.uid === uid).sort((a, b) => b.createdAt - a.createdAt);
  },
  saveChat: async (chat: Chat): Promise<void> => {
    const data = localStorage.getItem(STORAGE_KEY_CHATS);
    let chats: Chat[] = data ? JSON.parse(data) : [];
    const index = chats.findIndex(c => c.chatId === chat.chatId);
    if (index > -1) {
      chats[index] = chat;
    } else {
      chats.push(chat);
    }
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  },
  deleteChat: async (chatId: string): Promise<void> => {
    const data = localStorage.getItem(STORAGE_KEY_CHATS);
    let chats: Chat[] = data ? JSON.parse(data) : [];
    chats = chats.filter(c => c.chatId !== chatId);
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  },
  clearAllHistory: async (uid: string): Promise<void> => {
    const data = localStorage.getItem(STORAGE_KEY_CHATS);
    let chats: Chat[] = data ? JSON.parse(data) : [];
    chats = chats.filter(c => c.uid !== uid);
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  }
};
