import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, deleteDoc, getDocs, startAfter, QueryDocumentSnapshot, updateDoc, arrayUnion, arrayRemove, where, getDoc } from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { compressImage } from './lib/uploadUtils';

import { 
  UserProfile, 
  TrainingLog, 
  Message as ChatMessage, 
  GalleryItem, 
  Comment as GalleryComment, 
  Event as CalendarEvent, 
  Payment, 
  FeeConfig, 
  StoreItem, 
  Master,
  Language,
  AppConfig,
  AppNotification,
  Branch,
  EventNotice
} from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (nicknameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, nickname: string, password: string, photoURL?: string, role?: 'admin' | 'member') => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateOtherUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<void>;
  deleteOtherUserProfile: (userId: string) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<string>;
  sendMessage: (text?: string, imageUrl?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  uploadToGallery: (fileOrUrl: File | string, description?: string) => Promise<void>;
  deleteGalleryItem: (id: string, authorUid?: string) => Promise<void>;
  likeGalleryItem: (itemId: string, isLiked: boolean) => Promise<void>;
  reactToGalleryItem: (itemId: string, emoji: string) => Promise<void>;
  commentOnGalleryItem: (itemId: string, text: string) => Promise<void>;
  getGalleryComments: (itemId: string, callback: (comments: GalleryComment[]) => void) => () => void;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'authorUid' | 'createdAt'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePaymentStatus: (id: string, status: Payment['status']) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addFeeConfig: (config: Omit<FeeConfig, 'id'>) => Promise<void>;
  deleteFeeConfig: (id: string) => Promise<void>;
  addStoreItem: (item: Omit<StoreItem, 'id'>) => Promise<void>;
  updateStoreItem: (id: string, item: Partial<StoreItem>) => Promise<void>;
  deleteStoreItem: (id: string) => Promise<void>;
  addMaster: (master: Omit<Master, 'id'>) => Promise<void>;
  updateMaster: (id: string, master: Partial<Master>) => Promise<void>;
  deleteMaster: (id: string) => Promise<void>;
  addTrainingLog: (log: Omit<TrainingLog, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  trainingLogs: TrainingLog[];
  loadMoreGallery: () => Promise<void>;
  messages: ChatMessage[];
  galleryItems: GalleryItem[];
  hasMoreGallery: boolean;
  events: CalendarEvent[];
  payments: Payment[];
  feeConfigs: FeeConfig[];
  storeItems: StoreItem[];
  masters: Master[];
  allUsers: UserProfile[];
  userGallery: GalleryItem[];
  notifications: AppNotification[];
  branches: Branch[];
  markNotificationAsRead: (id: string) => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
  addBranch: (data: Omit<Branch, 'id' | 'createdAt'>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  isAdmin: boolean;
  appConfig: AppConfig | null;
  updateAppConfig: (data: Partial<AppConfig>) => Promise<void>;
  eventNotices: EventNotice[];
  addEventNotice: (data: Omit<EventNotice, 'id' | 'createdAt'>) => Promise<void>;
  deleteEventNotice: (id: string) => Promise<void>;
  uploadProgress: number;
  uploadFile: (file: File, path: string) => Promise<string>;
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  logs: { timestamp: number; message: string; type: 'info' | 'error' | 'warn' }[];
  addLog: (message: string, type?: 'info' | 'error' | 'warn') => void;
  unreadNotificationsCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [lastGalleryDoc, setLastGalleryDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreGallery, setHasMoreGallery] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userGallery, setUserGallery] = useState<GalleryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [eventNotices, setEventNotices] = useState<EventNotice[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [developerMode, setDeveloperMode] = useState(() => localStorage.getItem('devMode') === 'true');
  const [logs, setLogs] = useState<{ timestamp: number; message: string; type: 'info' | 'error' | 'warn' }[]>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'warn' = 'info') => {
    const newLog = { timestamp: Date.now(), message, type };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
    if (type === 'error') console.error(message);
    else if (type === 'warn') console.warn(message);
    else console.log(message);
  };

  useEffect(() => {
    localStorage.setItem('devMode', developerMode.toString());
  }, [developerMode]);

  const unreadNotificationsCount = notifications.filter(n => user && !n.readBy?.includes(user.uid)).length;

  const uploadFile = async (fileOrUrl: File | string, path: string) => {
    const isUrl = typeof fileOrUrl === 'string';
    addLog(`[NANO BANANA] Iniciando upload: ${isUrl ? 'URL' : fileOrUrl.name} para ${path}`);
    
    let fileToUpload: Blob;

    if (isUrl) {
      try {
        const response = await fetch(fileOrUrl, { referrerPolicy: 'no-referrer' });
        const blob = await response.blob();
        fileToUpload = blob;
      } catch (e: unknown) {
        throw new Error(`Falha ao buscar imagem da URL: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      fileToUpload = await compressImage(fileOrUrl as File);
    }

    const sanitizedName = isUrl ? `url_${Date.now()}.jpg` : fileOrUrl.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const storagePath = `${path}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);
    
    addLog(`[NANO BANANA] Gravando em: ${storagePath}`);
    
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          if (progress % 20 === 0) addLog(`Progresso do upload: ${progress.toFixed(0)}%`);
        }, 
        (error) => {
          addLog(`Erro no upload: ${error.message}`, 'error');
          setUploadProgress(0);
          reject(error);
        }, 
        async () => {
          try {
            addLog(`Upload concluído, obtendo URL...`);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            addLog(`URL obtida com sucesso: ${url.substring(0, 30)}...`);
            setUploadProgress(0);
            resolve(url);
          } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            addLog(`Erro ao obter URL: ${errorMsg}`, 'error');
            reject(e);
          }
        }
      );
    });
  };

  const GALLERY_PAGE_SIZE = 10;

  useEffect(() => {
    // Safety timeout for loading state
    const loadingTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("Auth loading timed out, forcing loading to false");
          return false;
        }
        return prev;
      });
    }, 10000);

    let unsubs: (() => void)[] = [];

    // Listen to app config
    const unsubConfig = onSnapshot(doc(db, 'config', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAppConfig({
          groupName: data.groupName || 'Incendeia Capoeira',
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '#CC0000',
          secondaryColor: data.secondaryColor || '#FF6600',
          fontFamily: data.fontFamily || 'font-black-ops',
          activeTabs: data.activeTabs || ['home', 'gallery', 'chat', 'store'],
          banners: data.banners || [],
          mural: data.mural || '',
          uiStyle: {
            borderRadius: data.uiStyle?.borderRadius || '16px',
            buttonStyle: data.uiStyle?.buttonStyle || 'neon',
            animationsEnabled: data.uiStyle?.animationsEnabled ?? true,
            headerStyle: data.uiStyle?.headerStyle || 'massive'
          },
          features: {
            geminiEnabled: data.features?.geminiEnabled ?? true,
            galleryEnabled: data.features?.galleryEnabled ?? true,
            storeEnabled: data.features?.storeEnabled ?? true,
            chatEnabled: data.features?.chatEnabled ?? true,
            notificationsEnabled: data.features?.notificationsEnabled ?? true,
            eventsEnabled: data.features?.eventsEnabled ?? true,
          },
          version: data.version || 1,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        } as AppConfig);
      } else {
        console.log('No app config found, using defaults');
        setAppConfig({
          groupName: 'Incendeia Capoeira',
          logoUrl: '',
          primaryColor: '#CC0000',
          fontFamily: 'font-black-ops',
          activeTabs: ['home', 'gallery', 'chat', 'store'],
          features: { 
            geminiEnabled: true, 
            galleryEnabled: true, 
            storeEnabled: true, 
            chatEnabled: true,
            notificationsEnabled: true,
            eventsEnabled: true
          },
          version: 1,
          updatedAt: null,
          updatedBy: ''
        } as AppConfig);
      }
    }, (error) => {
      console.error('Config listener error:', error);
      // Don't use handleFirestoreError here to avoid spamming the user on boot if they are not logged in
      // and the rule was restrictive. But now it's public read.
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      setUser(firebaseUser);
      
      // Clean up previous listeners
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (firebaseUser) {
        // Listen to profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Profile loaded:', data.nickname);
            
            // Auto-promote special admin
            const isSpecial = firebaseUser.email?.startsWith('andercapo0908') || firebaseUser.email === 'incendeiaproapp2026@gmail.com' || data.nickname?.toLowerCase() === 'andercapo0908';
            if (isSpecial && data.role !== 'admin') {
              updateDoc(userDocRef, { role: 'admin' }).catch(console.error);
            }
            
            setProfile(data as UserProfile);
          } else {
            console.log('No profile found, creating initial profile');
            // Create initial profile
            const initialProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || null,
              nickname: '',
              email: firebaseUser.email || null,
              photoURL: firebaseUser.photoURL || null,
              role: 'member',
              graduation: 'Iniciante',
              createdAt: serverTimestamp() as any,
            };
            setDoc(userDocRef, initialProfile, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'users/' + firebaseUser.uid));
          }
          setLoading(false);
        }, (error) => {
          console.error('Profile listener error:', error);
          handleFirestoreError(error, OperationType.GET, 'users/' + firebaseUser.uid);
          setLoading(false);
        });
        unsubs.push(unsubProfile);

        // Listen to chat messages
        const q = query(collection(db, 'chats', 'main', 'messages'), orderBy('createdAt', 'desc'), limit(50));
        const unsubMessages = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
          setMessages(msgs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'chats/main/messages');
        });
        unsubs.push(unsubMessages);

        // Initial gallery fetch
        const galleryQuery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(GALLERY_PAGE_SIZE));
        const unsubGallery = onSnapshot(galleryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
          setGalleryItems(items);
          setLastGalleryDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMoreGallery(snapshot.docs.length === GALLERY_PAGE_SIZE);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'gallery');
        });
        unsubs.push(unsubGallery);

        // Listen to events
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
          setEvents(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'events');
        });
        unsubs.push(unsubEvents);

        // Listen to store items
        const unsubStore = onSnapshot(collection(db, 'store'), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreItem));
          setStoreItems(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'store');
        });
        unsubs.push(unsubStore);

        // Listen to masters
        const unsubMasters = onSnapshot(collection(db, 'masters'), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Master));
          setMasters(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'masters');
        });
        unsubs.push(unsubMasters);

        // Listen to training logs
        const trainingQuery = query(collection(db, 'trainingLogs'), where('userId', '==', firebaseUser.uid));
        const unsubTraining = onSnapshot(trainingQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingLog));
          // Manual sort to avoid composite index requirement
          items.sort((a, b) => {
            const timeA = a.date?.toMillis?.() || a.date?.seconds * 1000 || new Date(a.date).getTime() || 0;
            const timeB = b.date?.toMillis?.() || b.date?.seconds * 1000 || new Date(b.date).getTime() || 0;
            return timeB - timeA;
          });
          setTrainingLogs(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'trainingLogs');
        });
        unsubs.push(unsubTraining);

        // Listen to user's own gallery items
        const userGalleryQuery = query(collection(db, 'gallery'), where('authorUid', '==', firebaseUser.uid));
        const unsubUserGallery = onSnapshot(userGalleryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
          // Manual sort to avoid composite index requirement
          items.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || new Date(a.createdAt).getTime() || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || new Date(b.createdAt).getTime() || 0;
            return timeB - timeA;
          });
          setUserGallery(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'gallery-user');
        });
        unsubs.push(unsubUserGallery);

        // Listen to notifications
        const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
        const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
          setNotifications(items);
          
          // Browser notification for new items
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
              const data = change.doc.data() as AppNotification;
              if (Notification.permission === 'granted') {
                new Notification(data.title, { body: data.body, icon: '/favicon.ico' });
              }
            }
          });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        });
        unsubs.push(unsubNotifications);

        // Listen to branches
        const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
          setBranches(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'branches');
        });
        unsubs.push(unsubBranches);

        // Listen to event notices
        const noticesQuery = query(collection(db, 'eventNotices'), orderBy('date', 'desc'), limit(10));
        const unsubNotices = onSnapshot(noticesQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventNotice));
          setEventNotices(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'eventNotices');
        });
        unsubs.push(unsubNotices);
      } else {
        console.log('User is null, clearing state');
        setProfile(null);
        setMessages([]);
        setGalleryItems([]);
        setLastGalleryDoc(null);
        setHasMoreGallery(true);
        setEvents([]);
        setPayments([]);
        setFeeConfigs([]);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    const isSpecialAdmin = user?.email?.startsWith('andercapo0908') || user?.email === 'incendeiaproapp2026@gmail.com' || profile?.nickname?.toLowerCase() === 'andercapo0908';
    setIsAdmin(profile?.role === 'admin' || isSpecialAdmin);
  }, [user, profile?.role, profile?.nickname]);

  // Initialize config if missing and user is admin
  useEffect(() => {
    if (isAdmin && !appConfig && user) {
      const defaultConfig: AppConfig = {
        groupName: 'Incendeia Capoeira',
        logoUrl: 'https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png',
        primaryColor: '#cc0000',
        fontFamily: 'Black Ops One',
        activeTabs: ['home', 'gallery', 'calendar', 'store', 'chat', 'masters'],
        features: {
          geminiEnabled: true,
          galleryEnabled: true,
          storeEnabled: true,
          chatEnabled: true,
          notificationsEnabled: true,
          eventsEnabled: true
        },
        uiStyle: {
          borderRadius: '16px',
          buttonStyle: 'neon',
          animationsEnabled: true,
          smokeEnabled: true,
          fireEnabled: true,
          vibrationEnabled: true,
          particlesEnabled: true
        },
        version: 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };
      setDoc(doc(db, 'config', 'current'), defaultConfig).catch(console.error);
    }
  }, [isAdmin, appConfig, user]);

  // Separate effect for Finance and Admin data to react to profile/isAdmin changes
  useEffect(() => {
    if (!user) return;

    const isSpecialAdmin = user?.email?.toLowerCase().includes('andercapo0908') || user?.email === 'incendeiaproapp2026@gmail.com' || profile?.nickname?.toLowerCase() === 'andercapo0908';
    const isAdminUser = profile?.role === 'admin' || isSpecialAdmin;

    // Listen to payments
    // If we are in a transition state where profile is not yet loaded, 
    // we default to the non-admin query to avoid permission errors.
    const paymentsQuery = (isAdminUser && profile)
      ? query(collection(db, 'payments'), orderBy('date', 'desc'))
      : query(collection(db, 'payments'), where('userId', '==', user.uid));
    
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      // Manual sort for non-admin to avoid composite index
      if (!(isAdminUser && profile)) {
        items.sort((a, b) => {
          const timeA = (a.date as any)?.toMillis?.() || (a.date as any)?.seconds * 1000 || new Date(a.date as any).getTime() || 0;
          const timeB = (b.date as any)?.toMillis?.() || (b.date as any)?.seconds * 1000 || new Date(b.date as any).getTime() || 0;
          return timeB - timeA;
        });
      }
      setPayments(items);
    }, (error) => {
      console.error("Payments listener error:", error);
      handleFirestoreError(error, OperationType.GET, 'payments');
    });

    // Listen to fee configs
    const unsubFees = onSnapshot(collection(db, 'feeConfigs'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeConfig));
      setFeeConfigs(items);
    }, (error) => {
      console.error("FeeConfigs listener error:", error);
      handleFirestoreError(error, OperationType.GET, 'feeConfigs');
    });

    // Listen to all users (for admin)
    let unsubAllUsers = () => {};
    if (isAdminUser) {
      unsubAllUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);
        setAllUsers(users);
      }, (error) => {
        console.error("AllUsers listener error:", error);
        handleFirestoreError(error, OperationType.GET, 'users');
      });
    }

    return () => {
      unsubPayments();
      unsubFees();
      unsubAllUsers();
    };
  }, [user, profile?.role]);

  const loadMoreGallery = async () => {
    if (!user || !lastGalleryDoc || !hasMoreGallery) return;

    const galleryQuery = query(
      collection(db, 'gallery'), 
      orderBy('createdAt', 'desc'), 
      startAfter(lastGalleryDoc),
      limit(GALLERY_PAGE_SIZE)
    );

    try {
      const snapshot = await getDocs(galleryQuery);
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
      
      setGalleryItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });
      setLastGalleryDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreGallery(snapshot.docs.length === GALLERY_PAGE_SIZE);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'gallery');
    }
  };

  const sanitizeNickname = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9.]/g, '.')    // Replace non-alphanumeric with dots
      .replace(/\.+/g, '.')           // Remove consecutive dots
      .replace(/^\.|\.$/g, '');       // Remove leading/trailing dots
  };

  const login = async (nicknameOrEmail: string, password: string) => {
    let emailToUse = nicknameOrEmail.trim();
    
    // Se não for um email (não tem @), tenta buscar o email pelo apelido
    if (!emailToUse.includes('@')) {
      const sanitizedNickname = sanitizeNickname(emailToUse);
      if (!sanitizedNickname) throw new Error("auth/invalid-email");

      try {
        const nicknameDoc = await getDoc(doc(db, 'nicknames', sanitizedNickname));
        if (nicknameDoc.exists()) {
          emailToUse = nicknameDoc.data().email;
        } else {
          // Fallback para o formato antigo caso o apelido não esteja na coleção
          emailToUse = `${sanitizedNickname}@incendeia.app`;
        }
      } catch (e) {
        console.error("Erro ao buscar apelido:", e);
        emailToUse = `${sanitizedNickname}@incendeia.app`;
      }
    }
    
    try {
      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (error: unknown) {
      if ((error as any).code === 'auth/invalid-email' && !nicknameOrEmail.includes('@')) {
        throw new Error("auth/invalid-credential");
      }
      throw error;
    }
  };

  const register = async (email: string, nickname: string, password: string, photoURL?: string, role: 'admin' | 'member' = 'member') => {
    const sanitizedNickname = sanitizeNickname(nickname);
    if (!sanitizedNickname) throw new Error("auth/invalid-email");
    
    // Se o email não for válido ou estiver vazio, podemos gerar um baseado no apelido
    let emailToUse = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailToUse || !emailRegex.test(emailToUse)) {
      emailToUse = `${sanitizedNickname}@incendeia.app`;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
    const firebaseUser = userCredential.user;

    // Salvar o mapeamento de apelido para email para futuros logins
    try {
      await setDoc(doc(db, 'nicknames', sanitizedNickname), { email: emailToUse });
    } catch (e) {
      console.error("Erro ao salvar apelido:", e);
    }

    // Create initial profile
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const initialProfile: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      displayName: nickname,
      nickname: nickname,
      email: emailToUse,
      photoURL: photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      role: role,
      graduation: 'Iniciante',
      createdAt: serverTimestamp() as any,
    };
    await setDoc(userDocRef, initialProfile, { merge: true });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, data, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users/' + user.uid);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) throw new Error("User not authenticated");
    return uploadFile(file, `profiles/${user.uid}`);
  };

  const updateOtherUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users/' + userId);
    }
  };

  const deleteOtherUserProfile = async (userId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'users/' + userId);
    }
  };

  const sendMessage = async (text?: string, imageUrl?: string) => {
    if (!user || (!text?.trim() && !imageUrl)) return;
    const messagesRef = collection(db, 'chats', 'main', 'messages');
    try {
      await addDoc(messagesRef, {
        text: text || '',
        imageUrl: imageUrl || null,
        authorUid: user.uid,
        authorName: profile?.nickname || user.displayName || 'Capoeirista',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'chats/main/messages');
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!user) return;
    const messageRef = doc(db, 'chats', 'main', 'messages', messageId);
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || {};
      const currentReactionUsers = reactions[emoji] || [];
      
      let newReactionUsers;
      if (currentReactionUsers.includes(user.uid)) {
        newReactionUsers = currentReactionUsers.filter(uid => uid !== user.uid);
      } else {
        newReactionUsers = [...currentReactionUsers, user.uid];
      }

      const newReactions = { ...reactions };
      if (newReactionUsers.length === 0) {
        delete newReactions[emoji];
      } else {
        newReactions[emoji] = newReactionUsers;
      }

      await updateDoc(messageRef, { reactions: newReactions });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/main/messages/${messageId}/reactions`);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'chats', 'main', 'messages', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'chats/main/messages/' + id);
    }
  };

  const uploadToGallery = async (fileOrUrl: File | string, description?: string) => {
    if (!user) return;
    
    // Determine type (default to image for URLs unless specified)
    let fileType: 'image' | 'video' = 'image';
    if (typeof fileOrUrl !== 'string') {
      fileType = fileOrUrl.type.startsWith('video/') ? 'video' : 'image';
    } else {
      // Very naive video check for URL
      if (fileOrUrl.match(/\.(mp4|webm|ogg|mov)$/i)) fileType = 'video';
    }
    
    try {
      const url = await uploadFile(fileOrUrl, `gallery/${user.uid}`);
      
      await addDoc(collection(db, 'gallery'), {
        url,
        type: fileType,
        description: description || '',
        authorUid: user.uid,
        authorName: profile?.nickname || user.displayName || 'Capoeirista',
        likes: [],
        reactions: {},
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'gallery');
    }
  };

  const deleteGalleryItem = async (id: string, authorUid?: string) => {
    if (!isAdmin && authorUid !== user?.uid) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'gallery/' + id);
    }
  };

  const likeGalleryItem = async (itemId: string, isLiked: boolean) => {
    if (!user) return;
    const itemRef = doc(db, 'gallery', itemId);
    try {
      await updateDoc(itemRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'gallery/' + itemId);
    }
  };

  const reactToGalleryItem = async (itemId: string, emoji: string) => {
    if (!user) return;
    const itemRef = doc(db, 'gallery', itemId);
    
    try {
      const itemSnap = await getDocs(query(collection(db, 'gallery'), limit(1))); // Just to get a ref or similar, but we need the current data
      // Actually we should just update the map. Firestore supports updating nested fields.
      // But for a map of arrays, it's tricky. Let's fetch first or use a transaction.
      // For simplicity in this prototype, I'll use a direct update if I can or just a simple map update.
      // Better: reactions[emoji] = arrayUnion(user.uid)
      await updateDoc(itemRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'gallery/' + itemId);
    }
  };

  const commentOnGalleryItem = async (itemId: string, text: string) => {
    if (!user || !text.trim()) return;
    const commentsRef = collection(db, 'gallery', itemId, 'comments');
    try {
      await addDoc(commentsRef, {
        text,
        authorUid: user.uid,
        authorName: profile?.nickname || user.displayName || 'Capoeirista',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `gallery/${itemId}/comments`);
    }
  };

  const getGalleryComments = (itemId: string, callback: (comments: GalleryComment[]) => void) => {
    const q = query(collection(db, 'gallery', itemId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryComment));
      callback(comments);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `gallery/${itemId}/comments`);
    });
  };

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'authorUid' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'events'), {
        ...eventData,
        authorUid: user.uid,
        createdAt: serverTimestamp()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        title: 'Novo Evento!',
        body: `${eventData.title} foi adicionado à agenda.`,
        type: 'event',
        link: 'calendar',
        createdAt: serverTimestamp(),
        readBy: []
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'events');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'events/' + id);
    }
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'events', id), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'events/' + id);
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'payments'), {
        ...paymentData,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payments');
    }
  };

  const updatePaymentStatus = async (id: string, status: Payment['status']) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'payments', id), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'payments/' + id);
    }
  };

  const deletePayment = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'payments/' + id);
    }
  };

  const addFeeConfig = async (configData: Omit<FeeConfig, 'id'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'feeConfigs'), configData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'feeConfigs');
    }
  };

  const deleteFeeConfig = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'feeConfigs', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'feeConfigs/' + id);
    }
  };

  const addStoreItem = async (itemData: Omit<StoreItem, 'id'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'store'), itemData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'store');
    }
  };

  const updateStoreItem = async (id: string, itemData: Partial<StoreItem>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'store', id), itemData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'store/' + id);
    }
  };

  const deleteStoreItem = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'store', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'store/' + id);
    }
  };

  const addMaster = async (masterData: Omit<Master, 'id'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'masters'), masterData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'masters');
    }
  };

  const updateMaster = async (id: string, masterData: Partial<Master>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'masters', id), masterData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'masters/' + id);
    }
  };

  const deleteMaster = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'masters', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'masters/' + id);
    }
  };

  const addTrainingLog = async (log: Omit<TrainingLog, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'trainingLogs'), {
        ...log,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'trainingLogs');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: arrayUnion(user.uid)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'notifications/' + id);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  };

  const addBranch = async (data: Omit<Branch, 'id' | 'createdAt'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'branches'), {
        ...data,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'branches');
    }
  };

  const updateBranch = async (id: string, data: Partial<Branch>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'branches', id), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'branches/' + id);
    }
  };

  const deleteBranch = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'branches/' + id);
    }
  };

  const addEventNotice = async (data: Omit<EventNotice, 'id' | 'createdAt'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'eventNotices'), {
        ...data,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'eventNotices');
    }
  };

  const deleteEventNotice = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'eventNotices', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'eventNotices/' + id);
    }
  };

  const updateAppConfig = async (data: Partial<AppConfig>) => {
    if (!isAdmin || !user) return;
    try {
      const currentConfigRef = doc(db, 'config', 'current');
      const newVersion = (appConfig?.version || 0) + 1;
      const updatedData = {
        ...appConfig,
        ...data,
        version: newVersion,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };
      
      if (appConfig) {
        await addDoc(collection(db, 'configHistory'), {
          config: appConfig,
          archivedAt: serverTimestamp()
        });
      }

      await setDoc(currentConfigRef, updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      login, 
      register, 
      loginWithGoogle,
      loginWithFacebook,
      logout, 
      updateProfile, 
      updateOtherUserProfile,
      deleteOtherUserProfile,
      uploadProfilePhoto,
      sendMessage, 
      reactToMessage,
      deleteMessage,
      uploadToGallery, 
      deleteGalleryItem,
      likeGalleryItem,
      reactToGalleryItem,
      commentOnGalleryItem,
      getGalleryComments,
      addEvent,
      deleteEvent,
      updateEvent,
      addPayment,
      updatePaymentStatus,
      deletePayment,
      addFeeConfig,
      deleteFeeConfig,
      addStoreItem,
      updateStoreItem,
      deleteStoreItem,
      addMaster,
      updateMaster,
      deleteMaster,
      addTrainingLog,
      trainingLogs,
      loadMoreGallery,
      messages, 
      galleryItems, 
      hasMoreGallery,
      events,
      payments,
      feeConfigs,
      storeItems,
      masters,
      allUsers,
      userGallery,
      notifications,
      branches,
      markNotificationAsRead,
      requestNotificationPermission,
      addBranch,
      updateBranch,
      deleteBranch,
      isAdmin,
      appConfig,
      updateAppConfig,
      eventNotices,
      addEventNotice,
      deleteEventNotice,
      uploadProgress,
      uploadFile,
      developerMode,
      setDeveloperMode,
      logs,
      addLog,
      unreadNotificationsCount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
