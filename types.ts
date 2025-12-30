
export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: number;
  lastActive: number;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  imageURL?: string;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export interface Chat {
  chatId: string;
  uid: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

export type Theme = 'light' | 'dark' | 'system';
