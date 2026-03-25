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
import { doc, onSnapshot, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, deleteDoc, getDocs, startAfter, QueryDocumentSnapshot, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  Language
} from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string, photoURL?: string, role?: 'admin' | 'member') => Promise<void>;
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
  uploadToGallery: (file: File, description?: string) => Promise<void>;
  deleteGalleryItem: (id: string, authorUid?: string) => Promise<void>;
  likeGalleryItem: (itemId: string, isLiked: boolean) => Promise<void>;
  reactToGalleryItem: (itemId: string, emoji: string) => Promise<void>;
  commentOnGalleryItem: (itemId: string, text: string) => Promise<void>;
  getGalleryComments: (itemId: string, callback: (comments: GalleryComment[]) => void) => () => void;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'authorUid' | 'createdAt'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
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
  isAdmin: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create initial profile
            const initialProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              nickname: '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'member',
              graduation: 'Iniciante',
              createdAt: serverTimestamp() as any,
            };
            setDoc(userDocRef, initialProfile, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'users/' + firebaseUser.uid));
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'users/' + firebaseUser.uid);
          setLoading(false);
        });

        // Listen to chat messages
        const q = query(collection(db, 'chats', 'main', 'messages'), orderBy('createdAt', 'desc'), limit(50));
        const unsubMessages = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
          setMessages(msgs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'chats/main/messages');
        });

        // Initial gallery fetch (real-time for the first page)
        const galleryQuery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(GALLERY_PAGE_SIZE));
        const unsubGallery = onSnapshot(galleryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
          setGalleryItems(items);
          setLastGalleryDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMoreGallery(snapshot.docs.length === GALLERY_PAGE_SIZE);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'gallery');
        });

        // Listen to events
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
          setEvents(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'events');
        });

        // Listen to store items
        const unsubStore = onSnapshot(collection(db, 'store'), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreItem));
          setStoreItems(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'store');
        });

        // Listen to masters
        const unsubMasters = onSnapshot(collection(db, 'masters'), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Master));
          setMasters(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'masters');
        });

        // Listen to training logs
        const trainingQuery = query(collection(db, 'trainingLogs'), where('userId', '==', firebaseUser.uid), orderBy('date', 'desc'));
        const unsubTraining = onSnapshot(trainingQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingLog));
          setTrainingLogs(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'trainingLogs');
        });

        // Listen to user's own gallery items
        const userGalleryQuery = query(collection(db, 'gallery'), where('authorUid', '==', firebaseUser.uid), orderBy('createdAt', 'desc'));
        const unsubUserGallery = onSnapshot(userGalleryQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
          setUserGallery(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'gallery-user');
        });

        return () => {
          unsubProfile();
          unsubMessages();
          unsubGallery();
          unsubEvents();
          unsubStore();
          unsubMasters();
          unsubTraining();
          unsubUserGallery();
        };
      } else {
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsAdmin(profile?.role === 'admin' || user?.email?.startsWith('andercapo0908'));
  }, [user, profile?.role]);

  // Separate effect for Finance and Admin data to react to profile/isAdmin changes
  useEffect(() => {
    if (!user) return;

    const isAdminUser = profile?.role === 'admin' || user?.email?.startsWith('andercapo0908');

    // Listen to payments
    const paymentsQuery = isAdminUser 
      ? query(collection(db, 'payments'), orderBy('date', 'desc'))
      : query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
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
      
      setGalleryItems(prev => [...prev, ...newItems]);
      setLastGalleryDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreGallery(snapshot.docs.length === GALLERY_PAGE_SIZE);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'gallery');
    }
  };

  const login = async (nickname: string, password: string) => {
    const sanitizedNickname = nickname.toLowerCase().trim().replace(/\s+/g, '.');
    const email = `${sanitizedNickname}@incendeia.app`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (nickname: string, password: string, photoURL?: string, role: 'admin' | 'member' = 'member') => {
    const sanitizedNickname = nickname.toLowerCase().trim().replace(/\s+/g, '.');
    const email = `${sanitizedNickname}@incendeia.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Create initial profile
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const initialProfile: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      displayName: nickname,
      nickname: nickname,
      email: email,
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
    const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
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

  const uploadToGallery = async (file: File, description?: string) => {
    if (!user) return;
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const storageRef = ref(storage, `gallery/${user.uid}/${Date.now()}_${file.name}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
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
      isAdmin
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
