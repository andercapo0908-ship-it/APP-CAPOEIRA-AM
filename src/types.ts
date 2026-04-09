import { Timestamp } from 'firebase/firestore';

export type Language = 'pt' | 'es';

export type View = 'splash' | 'login' | 'auth' | 'home' | 'profile' | 'edit-profile' | 'gallery' | 'masters' | 'calendar' | 'store' | 'finance' | 'chat' | 'users' | 'admin-panel' | 'ai-chat' | 'notifications' | 'graduations' | 'branches';

export interface Graduation {
  id: string;
  name: string;
  colors: string[]; // Array of colors for solo or mixed
  meaning: string;
  description: string;
  level: 'aluno' | 'graduado' | 'instrutor' | 'professor' | 'mestrando' | 'mestre';
}

export interface Branch {
  id: string;
  name: string;
  imageUrl: string;
  mapUrl: string;
  contact: string;
  trainingDays: string[];
  trainingHours: string;
  location: string;
  createdAt: any;
}

export interface AppConfig {
  logoUrl: string;
  primaryColor: string;
  fontFamily: string;
  activeTabs: string[];
  banners?: string[];
  mural?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
  features: {
    geminiEnabled: boolean;
    galleryEnabled: boolean;
    storeEnabled: boolean;
    chatEnabled: boolean;
  };
  version: number;
  updatedAt: any;
  updatedBy: string;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  displayName?: string;
  email?: string;
  photoURL: string;
  role: 'member' | 'admin';
  graduation: string;
  age: number;
  capoeiraTime: string;
  bio: string;
  birthDate: string;
  feedback: string;
  createdAt: any;
}

export interface TrainingLog {
  id: string;
  userId: string;
  date: any;
  feeling: string;
  duration: number;
  notes?: string;
}

export interface GalleryItem {
  id: string;
  userId: string;
  authorUid?: string;
  userName: string;
  authorName?: string;
  userPhoto: string;
  url: string;
  type: 'image' | 'video';
  description: string;
  createdAt: any;
  likes: string[];
  reactions: { [emoji: string]: string[] };
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  authorUid?: string;
  userName: string;
  authorName?: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

export interface Master {
  id: string;
  name: string;
  nickname?: string;
  role: string;
  photoURL: string;
  bio: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  createdAt?: any;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  type: 'training' | 'workshop' | 'roda' | 'event' | 'other';
  imageUrl?: string;
  createdAt?: any;
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  createdAt?: any;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  date: Timestamp | Date;
  status: 'pending' | 'paid' | 'overdue';
  type: 'monthly' | 'event' | 'other';
  description: string;
}

export interface FeeConfig {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'one-time';
  description: string;
}

export interface Message {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  imageUrl?: string;
  createdAt: any; // Using any here because Firestore serverTimestamp is complex to type strictly with Timestamp
  reactions?: { [emoji: string]: string[] };
}

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'event' | 'message' | 'system';
  link?: string;
  createdAt: any;
  readBy: string[];
}
