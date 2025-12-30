
export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: number;
  lastActive: number;
}

export type PersonaId = 'original' | 'evil_friend' | 'code_god' | 'mogul';

export interface Persona {
  id: PersonaId;
  name: string;
  description: string;
  instruction: string;
  icon: string;
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
  personaId: PersonaId;
}

export type Theme = 'light' | 'dark' | 'system';
