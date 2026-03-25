import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { 
  UserProfile, 
  TrainingLog, 
  GalleryItem, 
  Comment as GalleryComment, 
  Master, 
  Event as CalendarEvent, 
  StoreItem, 
  Payment, 
  FeeConfig, 
  Message as ChatMessage,
  Language,
  View
} from './types';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Home, 
  User, 
  Image as ImageIcon, 
  Users, 
  Award, 
  MapPin, 
  MessageSquare, 
  ShoppingBag, 
  DollarSign, 
  Menu,
  Plus,
  Edit,
  Edit2,
  Trash,
  Save,
  Camera,
  Heart,
  Smile,
  Send,
  MessageCircle,
  X,
  Play,
  Instagram,
  Globe,
  Calendar,
  CheckCircle2,
  Trash2,
  Facebook,
  FileText,
  TrendingUp,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// --- Types & Constants ---

const GRADUATIONS = [
  { name: 'Iniciante', color: '#ffffff' },
  { name: 'Batizado', color: '#ffff00' },
  { name: 'Graduado', color: '#00ff00' },
  { name: 'Monitor', color: '#0000ff' },
  { name: 'Instrutor', color: '#800080' },
  { name: 'Professor', color: '#ffa500' },
  { name: 'Mestre', color: '#cc0000' },
];

// --- Components ---

const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : new Date();
  }
  if (typeof date === 'number') return new Date(date);
  return new Date();
};

const LazyImage = ({ src, alt, className, objectFit = 'cover', imgClassName = '', wrapperClassName = '' }: { src: string; alt: string; className?: string; objectFit?: 'cover' | 'contain'; imgClassName?: string; wrapperClassName?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className} ${wrapperClassName}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-zinc-700" />
        </div>
      )}
      <LazyLoadImage
        alt={alt}
        src={src}
        effect="blur"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full transition-opacity duration-500 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        wrapperClassName="w-full h-full"
      />
    </div>
  );
};

const LazyVideo = ({ src, className, objectFit = 'cover', controls = false, autoPlay = false }: { src: string; className?: string; objectFit?: 'cover' | 'contain'; controls?: boolean; autoPlay?: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <Play className="w-8 h-8 text-zinc-700" />
        </div>
      )}
      <video 
        src={src} 
        onLoadedData={() => setIsLoaded(true)}
        controls={controls}
        autoPlay={autoPlay}
        className={`w-full h-full transition-opacity duration-500 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const Footer = ({ t }: { t: (pt: string, es: string) => string }) => (
  <div className="mt-8 py-4 flex flex-col items-center gap-1 z-10">
    <p className="text-incendeia-orange/40 text-[10px] font-bold uppercase tracking-[0.3em] text-center">
      APP INCENDEIA ON OFICIAL
    </p>
    <p className="text-incendeia-orange/30 text-[8px] font-bold uppercase tracking-[0.2em] text-center">
      DESENVOLVEDOR MESTRE DUENDE
    </p>
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  small = false,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  small?: boolean;
  disabled?: boolean;
}) => {
  const base = "font-black-ops text-white uppercase transition-all active:scale-95 btn-splash relative z-10 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-incendeia-red hover:bg-red-700",
    secondary: "bg-incendeia-orange hover:bg-orange-600",
    danger: "bg-zinc-800 hover:bg-zinc-700 border border-incendeia-red/30",
  };
  const size = small ? "px-3 py-1 text-[10px] rounded-lg" : "px-8 py-3 text-lg rounded-xl";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${size} ${className}`}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      {/* Rajado effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-inherit">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mix-blend-overlay"></div>
        <div className="absolute -inset-x-10 top-1/2 h-px bg-black rotate-12"></div>
        <div className="absolute -inset-x-10 top-1/3 h-px bg-black -rotate-12"></div>
      </div>
    </button>
  );
};

const Card = ({ children, onClick, title, icon: Icon }: { children?: React.ReactNode; onClick?: () => void; title: string; icon: React.ElementType }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="aspect-square bg-incendeia-red rounded-full flex flex-col items-center justify-center p-4 cursor-pointer border-2 border-transparent hover:border-incendeia-orange/50 shadow-lg shadow-black/50 group"
  >
    <Icon className="w-10 h-10 text-white mb-2 group-hover:scale-110 transition-transform" />
    <span className="text-[10px] font-black-ops text-white text-center uppercase tracking-tighter leading-none">{title}</span>
  </motion.div>
);

const InkButton = ({ 
  children, 
  onClick, 
  className = "",
  t,
  jaguar = false,
  small = false
}: { 
  children: React.ReactNode; 
  onClick?: (e: React.MouseEvent) => void; 
  className?: string;
  t: (pt: string, es: string) => string;
  jaguar?: boolean;
  small?: boolean;
}) => {
  const [inkDrops, setInkDrops] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setInkDrops(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setInkDrops(prev => prev.filter(drop => drop.id !== id));
    }, 600);

    if (onClick) onClick(e);
  };

  return (
    <button 
      onClick={handleClick}
      className={`distressed-red ${small ? 'py-2 px-6' : 'py-4 px-10'} rounded-full transition-all active:scale-95 group relative overflow-hidden ${className}`}
    >
      <span className={`relative z-20 ${small ? 'text-sm' : 'text-2xl'} font-black-ops text-white uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>
        {children}
      </span>
      {jaguar && (
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply invert bg-[url('https://www.transparenttextures.com/patterns/leopard.png')]"></div>
      )}
      {inkDrops.map(drop => (
        <div 
          key={drop.id} 
          className="ink-explosion" 
          style={{ left: drop.x, top: drop.y, width: '150px', height: '150px' }}
        />
      ))}
    </button>
  );
};

const LoginView = ({ t, setAuthRole, setView, setLang, setAuthMode }: { 
  t: (pt: string, es: string) => string; 
  setAuthRole: (role: 'member' | 'admin') => void; 
  setView: (view: View) => void; 
  setLang: (lang: Language) => void; 
  setAuthMode: (mode: 'login' | 'register') => void; 
}) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-premium-black">
    {/* Background with subtle texture/gradient */}
    <div className="absolute inset-0 z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ink-splash-orange opacity-10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ink-splash-orange opacity-5 blur-3xl"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md flex flex-col items-center gap-8 z-10"
    >
      {/* Language selection buttons at the top of the login screen */}
      <div className="flex gap-4 mb-8 bg-zinc-900/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
        <button 
          onClick={() => setLang('pt')} 
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 group relative overflow-hidden ${t('pt', '') === 'pt' ? 'bg-incendeia-red shadow-lg shadow-incendeia-red/20' : 'hover:bg-white/5'}`}
        >
          <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm flex-shrink-0">
            <img src="https://flagcdn.com/w80/br.png" alt="BR" className="w-full h-full object-cover" />
          </div>
          <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${t('pt', '') === 'pt' ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
            PT
          </span>
          {t('pt', '') === 'pt' && (
            <motion.div layoutId="activeLang" className="absolute inset-0 bg-white/10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </button>
        
        <div className="w-px h-4 bg-white/10 self-center" />
        
        <button 
          onClick={() => setLang('es')} 
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 group relative overflow-hidden ${t('', 'es') === 'es' ? 'bg-incendeia-red shadow-lg shadow-incendeia-red/20' : 'hover:bg-white/5'}`}
        >
          <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm flex-shrink-0">
            <img src="https://flagcdn.com/w80/es.png" alt="ES" className="w-full h-full object-cover" />
          </div>
          <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${t('', 'es') === 'es' ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
            ES
          </span>
          {t('', 'es') === 'es' && (
            <motion.div layoutId="activeLang" className="absolute inset-0 bg-white/10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 border-2 border-dashed border-incendeia-red/20 rounded-full"
          />
          <LazyImage 
            src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" 
            alt="Logo" 
            className="w-64 h-64"
            imgClassName="mix-blend-screen drop-shadow-[0_0_30px_rgba(204,0,0,0.6)]"
            objectFit="contain"
          />
        </div>
        <div className="flex flex-col items-center gap-0">
          <h1 className="text-4xl font-black-ops tracking-tighter text-center flex items-center gap-3">
            <span className="text-flag-br">INCENDEIA</span>
            <span className="text-flag-es">CAPOEIRA</span>
          </h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">{t('ENERGIA QUE CONTAGIA', 'ENERGÍA QUE CONTAGIA')}</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 px-8">
        <InkButton 
          t={t} 
          onClick={() => { setAuthRole('member'); setAuthMode('login'); setView('auth'); }} 
          className="w-full"
          jaguar={true}
          small={true}
        >
          {t('MEMBROS', 'MIEMBROS')}
        </InkButton>
        
        <InkButton 
          t={t} 
          onClick={() => { setAuthRole('admin'); setAuthMode('login'); setView('auth'); }} 
          className="w-full distressed-red !bg-zinc-800"
          jaguar={true}
          small={true}
        >
          {t('PAINEL ADM', 'PANEL ADM')}
        </InkButton>
      </div>

      <Footer t={t} />
    </motion.div>
  </div>
);

const AuthView = ({ t, setView, authRole, authMode, setAuthMode, handleAuth }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  authRole: 'member' | 'admin'; 
  authMode: 'login' | 'register'; 
  setAuthMode: (mode: 'login' | 'register') => void; 
  handleAuth: (nickname: string, password: string, photoURL?: string) => Promise<string | null>; 
}) => {
  const { uploadProfilePhoto } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAuthError('');
    try {
      // For registration, we don't have a user yet, so we can't use uploadProfilePhoto if it requires user.uid
      // Wait, uploadProfilePhoto in AuthContext uses user.uid.
      // If we are registering, we don't have a user yet.
      // I should modify uploadProfilePhoto to take an optional uid or handle registration case.
      // Actually, I can just upload it to a temporary path or use a different function.
      // But the user said "obrigatório" for the photo.
      // Maybe I should upload it AFTER the user is created?
      // But the register function takes the photoURL.
      // Let's modify uploadProfilePhoto to handle registration by using a temporary ID or just the nickname.
      // Or better, I'll add a separate function for uploading before registration.
      
      // Actually, I'll modify uploadProfilePhoto in AuthContext to not require user.uid if we pass one.
      // Or I'll just use a generic path for registration photos.
      
      const storageRef = ref(storage, `temp_profiles/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setPhotoURL(url);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setAuthError(t('Erro ao carregar foto', 'Error al cargar foto'));
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async () => {
    setAuthError('');
    
    // Validation
    if (!nickname.trim()) {
      setAuthError(t('O apelido é obrigatório', 'El apodo es obligatorio'));
      return;
    }
    
    if (password.length < 6) {
      setAuthError(t('A senha deve ter pelo menos 6 caracteres', 'La contraseña deve tener al menos 6 caracteres'));
      return;
    }

    if (authMode === 'register' && authRole === 'admin' && !photoURL) {
      setAuthError(t('A foto de perfil é obrigatória para administradores', 'La foto de perfil es obligatoria para administradores'));
      return;
    }

    setIsSubmitting(true);
    const error = await handleAuth(nickname, password, photoURL);
    if (error) {
      setAuthError(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-premium-black">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
      
      <button onClick={() => setView('login')} className="absolute top-6 left-6 p-2 text-incendeia-red z-20">
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <LazyImage 
            src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" 
            alt="Logo Oficial" 
            className="w-20 h-20"
            imgClassName="mix-blend-screen drop-shadow-[0_0_15px_rgba(204,0,0,0.4)]"
            objectFit="contain"
          />
          <div className="flex flex-row items-center gap-2 mt-4">
            <div className="px-4 py-1 bg-incendeia-red rounded-lg border border-white/20 shadow-lg">
              <span className="text-xl font-black-ops text-white tracking-tight">INCENDEIA</span>
            </div>
            <div className="px-4 py-1 bg-zinc-800 rounded-lg border border-white/20 shadow-lg">
              <span className="text-xl font-black-ops text-white tracking-tight">CAPOEIRA</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-zinc-900/80 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('ENTRAR', 'ENTRAR')}
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('CADASTRAR', 'REGISTRAR')}
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-black-ops text-white uppercase tracking-widest">
            {authRole === 'admin' ? t('ACESSO ADM', 'ACCESO ADM') : t('ACESSO ALUNO', 'ACCESO ALUMNO')}
          </h2>
        </div>

        <div className="flex flex-col gap-6 bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
          {authMode === 'register' && (
            <div className="flex flex-col items-center gap-4 mb-2">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-24 h-24 rounded-full border-2 border-dashed ${photoURL ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group`}
              >
                {photoURL ? (
                  <img src={photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center text-zinc-500">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-tighter">{t('FOTO PERFIL', 'FOTO PERFIL')}</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-incendeia-red border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {photoURL ? t('FOTO CARREGADA', 'FOTO CARGADA') : (authRole === 'admin' ? t('FOTO OBRIGATÓRIA', 'FOTO OBLIGATORIA') : t('FOTO OPCIONAL', 'FOTO OPCIONAL'))}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('APELIDO', 'APODO')}</label>
            <input 
              type="text" 
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className={`bg-black/50 border ${authError && !nickname.trim() ? 'border-red-500' : 'border-white/10'} rounded-xl p-4 text-white focus:border-incendeia-red outline-none transition-all`} 
              placeholder={t('Seu apelido...', 'Tu apodo...')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('SENHA', 'CONTRASEÑA')}</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSubmit()}
              className={`bg-black/50 border ${authError && password.length < 6 ? 'border-red-500' : 'border-white/10'} rounded-xl p-4 text-white focus:border-incendeia-red outline-none transition-all`} 
              placeholder="******"
            />
          </div>

          {authError && <p className="text-red-500 text-xs text-center font-bold uppercase">{authError}</p>}

          <InkButton t={t} onClick={onSubmit} className="w-full mt-2" jaguar={true} small={true}>
            <span className="text-xs">{isSubmitting ? t('CARREGANDO...', 'CARGANDO...') : (authMode === 'login' ? t('ENTRAR', 'ENTRAR') : t('SALVAR', 'GUARDAR'))}</span>
          </InkButton>
        </div>
        <Footer t={t} />
      </div>
    </div>
  );
};

const HomeView = ({ t, setView, profile, hasNewMessages }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  profile: UserProfile | null; 
  hasNewMessages: boolean; 
}) => {
  const menuItems = [
    { title: t('MEU PERFIL', 'MI PERFIL'), icon: User, onClick: () => setView('profile') },
    { title: t('GALERIA', 'GALERIA'), icon: ImageIcon, onClick: () => setView('gallery') },
    { title: t('MESTRES', 'MAESTROS'), icon: Users, onClick: () => setView('masters') },
    { title: t('CHAT', 'CHAT'), icon: MessageSquare, onClick: () => setView('chat'), hasNotification: hasNewMessages },
    { title: t('LOCAIS', 'LUGARES'), icon: MapPin, onClick: () => setView('calendar') },
    { title: t('LOJA', 'TIENDA'), icon: ShoppingBag, onClick: () => setView('store') },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 bg-incendeia-red/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        {/* Central Logo */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center"
        >
          <LazyImage 
            src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" 
            alt="Logo Oficial" 
            className="w-full h-full"
            imgClassName="mix-blend-screen drop-shadow-[0_0_20px_rgba(204,0,0,0.5)]"
            objectFit="contain"
          />
        </motion.div>

        {/* Rotating Menu Container */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full flex items-center justify-center"
        >
          {menuItems.map((item, index) => {
            const angle = (index * (360 / menuItems.length)) - 90;
            const radius = 140;
            
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  transform: `rotate(${angle}deg) translate(${radius}px)`
                }}
              >
                {/* Counter-rotate the item to keep it upright */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={item.onClick}
                    className="w-16 h-16 bg-incendeia-red rounded-full flex flex-col items-center justify-center p-2 cursor-pointer border-2 border-white/10 shadow-xl shadow-black/50 group hover:border-incendeia-orange transition-colors relative"
                  >
                    <item.icon className="w-6 h-6 text-white mb-0.5 group-hover:scale-110 transition-transform" />
                    {item.hasNotification && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-white border-2 border-incendeia-red rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20" />
                    )}
                    <span className="text-[6px] font-black-ops text-white text-center uppercase tracking-tighter leading-none px-1">
                      {item.title}
                    </span>
                    
                    {/* Fire effect on hover */}
                    <div className="absolute -inset-1 rounded-full border border-incendeia-orange/0 group-hover:border-incendeia-orange/50 group-hover:animate-pulse transition-all" />
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

const ProfileView = ({ t, setView, profile, logout, showConfirm }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  profile: UserProfile | null; 
  logout: () => void; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
}) => {
  const { trainingLogs, addTrainingLog, userGallery, uploadToGallery, deleteGalleryItem, user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const graduationColor = GRADUATIONS.find(g => g.name === profile?.graduation)?.color || '#ffffff';
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const currentMonthLogs = trainingLogs.filter(log => {
    const logDate = safeToDate(log.date);
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  });

  const totalHours = currentMonthLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const totalDays = new Set(currentMonthLogs.map(log => {
    const d = safeToDate(log.date);
    return d.toDateString();
  })).size;

  const feelings = [
    { emoji: '🔥', label: 'Super' },
    { emoji: '😊', label: 'Feliz' },
    { emoji: '🚀', label: 'Top' },
    { emoji: '😢', label: 'Triste' },
    { emoji: '⚡', label: 'Motivado' }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadToGallery(file, '');
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = (id: string, authorUid?: string) => {
    showConfirm(
      t('EXCLUIR FOTO', 'ELIMINAR FOTO'),
      t('Deseja excluir esta foto da sua galeria?', '¿Desea eliminar esta foto de su galería?'),
      () => deleteGalleryItem(id, authorUid)
    );
  };

  return (
    <div className="pb-24 bg-premium-black min-h-screen">
      {/* Header with Dark Green Texture */}
      <div className="relative h-64 bg-emerald-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-premium-black" />
        
        {/* Profile Info in Header */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Fire Circle Effect */}
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
              className="absolute inset-0 rounded-full blur-xl opacity-80"
              style={{ 
                background: `conic-gradient(from 0deg, transparent, ${graduationColor}, transparent, ${graduationColor}, transparent)`,
                boxShadow: `0 0 40px ${graduationColor}`
              }}
            />
            {/* Fire Flames Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-20, -60], 
                    opacity: [0, 0.8, 0],
                    scale: [1, 1.5, 0.5],
                    rotate: [0, 45, -45]
                  }}
                  transition={{ 
                    duration: 1.5 + Math.random(), 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full blur-sm"
                  style={{ 
                    backgroundColor: graduationColor,
                    marginLeft: `${(i - 6) * 10}px`,
                  }}
                />
              ))}
            </div>

            <div className="w-28 h-28 rounded-full border-4 border-premium-black p-1 relative z-10 overflow-hidden bg-zinc-800 shadow-2xl">
              <LazyImage 
                src={profile?.photoURL || "https://picsum.photos/seed/capoeira-user/200/200"} 
                alt={profile?.nickname || 'Profile'} 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
          </div>
          
          <h2 className="text-2xl font-black-ops text-white uppercase tracking-widest mt-4 shadow-sm">{profile?.nickname}</h2>
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">{t('GRADUAÇÃO', 'GRADUACIÓN')}:</span>
            <span className="text-white font-bold uppercase tracking-widest text-sm" style={{ color: graduationColor }}>{profile?.graduation}</span>
          </div>
        </div>
      </div>

      <div className="p-6 -mt-6 relative z-20">
        {/* Check-in Section */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-incendeia-red/20 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-incendeia-red" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Check-in</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date().toLocaleDateString()}</span>
          </div>
          <InkButton 
            t={t} 
            onClick={() => addTrainingLog({ date: new Date(), feeling: '🔥', duration: 1.5 })}
            className="w-full py-4 text-sm"
          >
            {t('MARCAR PRESENÇA', 'MARCAR PRESENCIA')}
          </InkButton>
        </div>

        {/* Training Feeling Panel */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 mb-6 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 text-center">
            {t('HOJE O TREINO FOI', 'HOY EL ENTRENO FUE')}
          </h3>
          <div className="flex justify-between items-center gap-2">
            {feelings.map(f => (
              <button
                key={f.label}
                onClick={() => addTrainingLog({ date: new Date(), feeling: f.emoji, duration: 1.5 })}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-incendeia-red/20 transition-all group-hover:scale-110 border border-white/5 group-active:scale-95">
                  {f.emoji}
                </div>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 text-incendeia-red mb-2" />
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('TREINOS NO MÊS', 'ENTRENOS AL MES')}</span>
            <span className="text-xl font-black-ops text-white">{totalDays} {t('DIAS', 'DÍAS')}</span>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center text-center">
            <PieChartIcon className="w-6 h-6 text-incendeia-orange mb-2" />
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('TOTAL DE HORAS', 'TOTAL DE HORAS')}</span>
            <span className="text-xl font-black-ops text-white">{totalHours}H</span>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-incendeia-red" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">{t('CALENDÁRIO DE TREINOS', 'CALENDARIO DE ENTRENOS')}</h3>
            </div>
            <button 
              onClick={() => setView('calendar')}
              className="text-[10px] font-bold text-incendeia-red uppercase tracking-widest flex items-center gap-1 hover:underline"
            >
              {t('ADICIONAR EVENTO', 'AÑADIR EVENTO')}
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <span key={d} className="text-[8px] font-bold text-zinc-600 mb-2">{d}</span>
            ))}
            {/* Empty slots for the first week */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasLog = currentMonthLogs.some(log => {
                const d = safeToDate(log.date);
                return d.getDate() === day;
              });
              return (
                <motion.div 
                  key={i} 
                  whileTap={{ scale: 0.9 }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${hasLog ? 'bg-incendeia-red text-white shadow-lg shadow-incendeia-red/40 scale-110 z-10' : 'text-zinc-500 bg-black/40 hover:bg-white/5'}`}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Personal Gallery Section */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-incendeia-orange" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">{t('MINHAS FOTOS', 'MIS FOTOS')}</h3>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-incendeia-orange/20 p-2 rounded-lg hover:bg-incendeia-orange/30 transition-colors disabled:opacity-50"
            >
              {isUploading ? <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4 text-incendeia-orange" />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {userGallery.length > 0 ? (
              userGallery.map(item => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  <LazyImage src={item.url} alt="User media" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => handleDeletePhoto(item.id, item.authorUid)}
                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-white/5">
                {t('NENHUMA FOTO ADICIONADA', 'NINGUNA FOTO AÑADIDA')}
              </div>
            )}
          </div>
        </div>

        {/* Info List */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex justify-between items-center">
            <span className="text-zinc-500 text-xs font-bold uppercase">{t('APELIDO', 'APODO')}</span>
            <span className="text-white font-black-ops">{profile?.nickname}</span>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex justify-between items-center">
            <span className="text-zinc-500 text-xs font-bold uppercase">{t('NASCIMENTO', 'NACIMIENTO')}</span>
            <span className="text-white font-black-ops">{profile?.birthDate || '---'}</span>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col gap-2">
            <span className="text-zinc-500 text-xs font-bold uppercase">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</span>
            <p className="text-zinc-300 text-sm italic">{profile?.bio || t('Sem descrição...', 'Sin descripción...')}</p>
          </div>
          {profile?.feedback && (
            <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col gap-2">
              <span className="text-zinc-500 text-xs font-bold uppercase">{t('FEEDBACK', 'FEEDBACK')}</span>
              <p className="text-zinc-300 text-sm">{profile.feedback}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <InkButton t={t} onClick={() => setView('edit-profile')} className="w-full">{t('EDITAR PERFIL', 'EDITAR PERFIL')}</InkButton>
          <button onClick={logout} className="w-full py-4 text-zinc-500 font-bold uppercase text-xs hover:text-red-500 transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            {t('SAIR DA CONTA', 'CERRAR SESIÓN')}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProfileView = ({ t, initialData, handleSaveProfile, setView }: { 
  t: (pt: string, es: string) => string; 
  initialData: UserProfile; 
  handleSaveProfile: (data: UserProfile) => Promise<void>; 
  setView: (view: View) => void; 
}) => {
  const { uploadProfilePhoto } = useAuth();
  const [editData, setEditData] = useState(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadProfilePhoto(file);
      setEditData({ ...editData, photoURL: url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-black-ops text-incendeia-red mb-8 uppercase">{t('EDITAR PERFIL', 'EDITAR PERFIL')}</h2>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 items-center mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-incendeia-red p-1 relative overflow-hidden">
            <img src={editData.photoURL || "https://picsum.photos/seed/capoeira-user/200/200"} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-incendeia-red border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <Button 
            variant="danger" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs"
            small
          >
            <Camera className="w-4 h-4 mr-2" />
            {t('ALTERAR FOTO', 'CAMBIAR FOTO')}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('APELIDO', 'APODO')}</label>
          <input 
            type="text" 
            value={editData.nickname}
            onChange={e => setEditData({...editData, nickname: e.target.value})}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('GRADUAÇÃO', 'GRADUACIÓN')}</label>
          <select 
            value={editData.graduation}
            onChange={e => setEditData({...editData, graduation: e.target.value})}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
          >
            {GRADUATIONS.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DATA DE NASCIMENTO', 'FECHA DE NACIMIENTO')}</label>
          <input 
            type="date" 
            value={editData.birthDate || ''}
            onChange={e => setEditData({...editData, birthDate: e.target.value})}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('IDADE', 'EDAD')}</label>
          <input 
            type="number" 
            value={editData.age}
            onChange={e => setEditData({...editData, age: parseInt(e.target.value) || 0})}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('TEMPO DE CAPOEIRA', 'TIEMPO DE CAPOEIRA')}</label>
          <input 
            type="text" 
            value={editData.capoeiraTime}
            onChange={e => setEditData({...editData, capoeiraTime: e.target.value})}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
          <textarea 
            value={editData.bio}
            onChange={e => setEditData({...editData, bio: e.target.value})}
            placeholder={t('Conte um pouco sobre você...', 'Cuéntanos un poco sobre ti...')}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red min-h-[100px] resize-none" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('FEEDBACK', 'FEEDBACK')}</label>
          <textarea 
            value={editData.feedback}
            onChange={e => setEditData({...editData, feedback: e.target.value})}
            placeholder={t('Deixe seu feedback para o mestre...', 'Deja tu feedback para el mestre...')}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red min-h-[100px] resize-none" 
          />
        </div>
        <div className="flex gap-4 mt-4">
          <Button variant="danger" className="flex-1" onClick={() => setView('profile')}>{t('CANCELAR', 'CANCELAR')}</Button>
          <Button onClick={() => handleSaveProfile(editData as UserProfile)} className="flex-1">{t('SALVAR ALTERAÇÕES', 'GUARDAR CAMBIOS')}</Button>
        </div>
      </div>
    </div>
  );
};

const GalleryView = ({ t, setView, isAdmin, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  isAdmin: boolean; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { galleryItems, uploadToGallery, loadMoreGallery, hasMoreGallery, likeGalleryItem, reactToGalleryItem, commentOnGalleryItem, getGalleryComments, user, deleteGalleryItem } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreGallery && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMoreGallery, isLoadingMore]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadMoreGallery();
    setIsLoadingMore(false);
  };
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      await uploadToGallery(pendingFile, uploadDescription);
      setShowUploadModal(false);
      setUploadDescription('');
      setPendingFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredItems = galleryItems.filter(item => item.type === activeTab);

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('GALERIA', 'GALERIA')}</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t('Fotos e Vídeos do Grupo', 'Fotos y Videos del Grupo')}</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-incendeia-red p-3 rounded-2xl shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest pr-1 hidden sm:inline">{t('ENVIAR', 'ENVIAR')}</span>
            </>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*,video/*"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'image' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('FOTOS', 'FOTOS')}
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('VÍDEOS', 'VIDEOS')}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">{t('Nenhuma mídia ainda', 'Ninguna mídia todavía')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedItemIndex(index)}
                className="aspect-square rounded-2xl overflow-hidden border border-white/5 shadow-xl bg-zinc-900 relative group cursor-pointer"
              >
                {item.type === 'video' ? (
                  <LazyVideo src={item.url} className="w-full h-full" />
                ) : (
                  <LazyImage src={item.url} alt={item.description || 'Gallery image'} className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex items-center gap-3 text-white">
                    <div className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${item.likes?.includes(user?.uid || '') ? 'fill-incendeia-red text-incendeia-red' : ''}`} />
                      <span className="text-[10px] font-bold">{item.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">...</span>
                    </div>
                  </div>
                </div>
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <Play className="w-8 h-8 text-white opacity-80" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Sentinel element for infinite scroll */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
            {isLoadingMore && (
              <div className="w-6 h-6 border-2 border-incendeia-red border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUploading && setShowUploadModal(false)}
              className="fixed inset-0 bg-black/90 z-[150] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[160] rounded-[32px] border border-white/10 p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{t('NOVA POSTAGEM', 'NUEVA PUBLICACIÓN')}</h3>
              
              <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-black border border-white/5">
                {pendingFile?.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(pendingFile)} className="w-full h-full object-contain" controls />
                ) : (
                  pendingFile && <img src={URL.createObjectURL(pendingFile)} className="w-full h-full object-contain" />
                )}
              </div>

              <div className="flex flex-col gap-2 mb-8">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
                <textarea 
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red min-h-[100px] resize-none"
                  placeholder={t('Escreva algo sobre esta mídia...', 'Escribe algo sobre esta mídia...')}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {t('CANCELAR', 'CANCELAR')}
                </button>
                <button 
                  disabled={isUploading}
                  onClick={handleUpload}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-incendeia-red text-white shadow-lg shadow-incendeia-red/20 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('POSTAR', 'PUBLICAR')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItemIndex !== null && (
          <GalleryItemDetail 
            items={filteredItems}
            initialIndex={selectedItemIndex}
            onClose={() => setSelectedItemIndex(null)} 
            t={t} 
            user={user}
            likeGalleryItem={likeGalleryItem}
            reactToGalleryItem={reactToGalleryItem}
            commentOnGalleryItem={commentOnGalleryItem}
            getGalleryComments={getGalleryComments}
            deleteGalleryItem={deleteGalleryItem}
            isAdmin={isAdmin}
            showConfirm={showConfirm}
            showAlert={showAlert}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const GalleryItemDetail = ({ 
  items, 
  initialIndex, 
  onClose, 
  t, 
  user, 
  likeGalleryItem, 
  reactToGalleryItem, 
  commentOnGalleryItem, 
  getGalleryComments, 
  deleteGalleryItem, 
  isAdmin, 
  showConfirm, 
  showAlert 
}: { 
  items: GalleryItem[]; 
  initialIndex: number; 
  onClose: () => void; 
  t: (pt: string, es: string) => string; 
  user: any; 
  likeGalleryItem: (id: string, isLiked: boolean) => Promise<void>; 
  reactToGalleryItem: (id: string, emoji: string) => Promise<void>; 
  commentOnGalleryItem: (id: string, text: string) => Promise<void>; 
  getGalleryComments: (id: string, callback: (comments: GalleryComment[]) => void) => () => void; 
  deleteGalleryItem: (id: string) => Promise<void>; 
  isAdmin: boolean; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  
  const item = items[currentIndex];
  const isLiked = item.likes?.includes(user?.uid || '');

  useEffect(() => {
    const unsub = getGalleryComments(item.id, setComments);
    return () => unsub();
  }, [item.id]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const emojis = ['🔥', '👏', '💪', '❤️', '🤸', '🥋'];

  const handleDelete = async () => {
    showConfirm(
      t('EXCLUIR MÍDIA', 'ELIMINAR MEDIO'),
      t('Deseja excluir esta mídia?', '¿Desea eliminar este medio?'),
      async () => {
        await deleteGalleryItem(item.id);
        onClose();
      }
    );
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/95 z-[200] backdrop-blur-lg"
      />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="fixed bottom-0 left-0 right-0 bg-zinc-900 z-[210] rounded-t-[40px] border-t border-incendeia-red/30 flex flex-col max-h-[90vh]"
      >
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto my-4 shrink-0" />
        
        <div className="overflow-y-auto flex-1 p-6">
          <div className="aspect-square rounded-3xl overflow-hidden mb-6 bg-black border border-white/5 relative group">
            {item.type === 'video' ? (
              <LazyVideo src={item.url} className="w-full h-full" objectFit="contain" controls autoPlay />
            ) : (
              <LazyImage src={item.url} alt={item.description || 'Gallery image'} className="w-full h-full" objectFit="contain" />
            )}
            
            {/* Navigation Buttons */}
            {currentIndex > 0 && (
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < items.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => likeGalleryItem(item.id, isLiked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isLiked ? 'bg-incendeia-red/10 border-incendeia-red text-incendeia-red' : 'border-white/10 text-zinc-400'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-incendeia-red' : ''}`} />
                <span className="text-xs font-bold">{item.likes?.length || 0}</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowReactions(!showReactions)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-zinc-400 hover:bg-white/5 transition-all"
                >
                  <Smile className="w-5 h-5" />
                  <span className="text-xs font-bold">
                    {Object.values(item.reactions || {}).flat().length || 0}
                  </span>
                </button>

                <AnimatePresence>
                  {showReactions && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-white/10 p-2 rounded-2xl flex gap-2 shadow-2xl z-50"
                    >
                      {emojis.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => {
                            reactToGalleryItem(item.id, emoji);
                            setShowReactions(false);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <p className="text-[10px] font-bold text-incendeia-red uppercase tracking-widest">{item.authorName}</p>
                <p className="text-[8px] text-zinc-500 uppercase font-bold">{item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '...'}</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {item.description && (
            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 mb-8">
              <p className="text-zinc-300 text-sm leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Reactions Summary */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {Object.entries(item.reactions).map(([emoji, uids]: [string, any]) => (
                <div key={emoji} className="bg-zinc-800/50 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-[10px] font-bold text-zinc-400">{uids.length}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageCircle className="w-3 h-3" />
              {t('COMENTÁRIOS', 'COMENTARIOS')} ({comments.length})
            </h4>
            
            <div className="flex flex-col gap-4 mb-6">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold text-incendeia-red uppercase tracking-widest">{comment.authorName}</span>
                    <span className="text-[8px] text-zinc-600 font-bold">{comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'HH:mm') : ''}</span>
                  </div>
                  <p className="text-white text-xs leading-relaxed">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center py-4 text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
                  {t('Seja o primeiro a comentar', 'Sé el primero en comentar')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-6 bg-zinc-900 border-t border-white/5 shrink-0">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commentOnGalleryItem(item.id, newComment).then(() => setNewComment(''))}
              placeholder={t('Escreva um comentário...', 'Escribe un comentario...')}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-incendeia-red"
            />
            <button 
              onClick={() => commentOnGalleryItem(item.id, newComment).then(() => setNewComment(''))}
              disabled={!newComment.trim()}
              className="bg-incendeia-red p-3 rounded-xl text-white disabled:opacity-50 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const MastersView = ({ t, showConfirm }: { 
  t: (pt: string, es: string) => string; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
}) => {
  const { masters, isAdmin, addMaster, updateMaster, deleteMaster } = useAuth();
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [newMaster, setNewMaster] = useState<Omit<Master, 'id'>>({ name: '', role: '', bio: '', photoURL: '', instagram: '', website: '' });

  const handleAddMaster = async () => {
    if (!newMaster.name || !newMaster.role) return;
    if (editingMasterId) {
      await updateMaster(editingMasterId, newMaster);
    } else {
      await addMaster({ ...newMaster, createdAt: new Date() });
    }
    setShowAddModal(false);
    setEditingMasterId(null);
    setNewMaster({ name: '', role: '', bio: '', photoURL: '', instagram: '', website: '' });
  };

  const handleEditMaster = (m: Master, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewMaster({ 
      name: m.name, 
      role: m.role, 
      bio: m.bio || '', 
      photoURL: m.photoURL, 
      instagram: m.instagram || '', 
      website: m.website || '' 
    });
    setEditingMasterId(m.id);
    setShowAddModal(true);
  };

  const handleDeleteMaster = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      t('EXCLUIR MESTRE', 'ELIMINAR MAESTRO'),
      t('Deseja excluir este mestre?', '¿Desea eliminar este maestro?'),
      async () => {
        await deleteMaster(id);
        if (selectedMaster?.id === id) setSelectedMaster(null);
      }
    );
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('NOSSOS MESTRES', 'NUESTROS MAESTROS')}</h2>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-3 bg-incendeia-red rounded-2xl text-white shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-6">
        {masters.map((m: Master) => (
          <motion.div 
            key={m.id} 
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMaster(m)}
            className="bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex items-center gap-6 cursor-pointer hover:bg-zinc-800/50 transition-colors relative"
          >
            <LazyImage src={m.photoURL || 'https://picsum.photos/seed/mestre/200/200'} alt={m.name} className="w-20 h-20 rounded-full border-2 border-incendeia-red" />
            <div className="flex-1">
              <h3 className="text-lg font-black-ops text-white uppercase">{m.name}</h3>
              <p className="text-incendeia-red text-[10px] font-bold uppercase tracking-widest">{m.role}</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button 
                    onClick={(e) => handleEditMaster(m, e)}
                    className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteMaster(m.id, e)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </>
              )}
              <ChevronLeft className="w-5 h-5 text-zinc-600 rotate-180" />
            </div>
          </motion.div>
        ))}
        {masters.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/30 rounded-[32px] border border-dashed border-white/10">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{t('Nenhum mestre cadastrado', 'Ningún maestro registrado')}</p>
          </div>
        )}
      </div>

      {/* Add Master Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/90 z-[150] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[160] rounded-[32px] border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{editingMasterId ? t('EDITAR MESTRE', 'EDITAR MAESTRO') : t('NOVO MESTRE', 'NUEVO MAESTRO')}</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('NOME', 'NOMBRE')}</label>
                  <input 
                    type="text" 
                    value={newMaster.name}
                    onChange={e => setNewMaster({...newMaster, name: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-incendeia-red"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('FUNÇÃO', 'FUNCIÓN')}</label>
                  <input 
                    type="text" 
                    value={newMaster.role}
                    onChange={e => setNewMaster({...newMaster, role: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-incendeia-red"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('FOTO URL', 'FOTO URL')}</label>
                  <input 
                    type="text" 
                    value={newMaster.photoURL}
                    onChange={e => setNewMaster({...newMaster, photoURL: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-incendeia-red"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('BIOGRAFIA', 'BIOGRAFÍA')}</label>
                  <textarea 
                    value={newMaster.bio}
                    onChange={e => setNewMaster({...newMaster, bio: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">INSTAGRAM</label>
                  <input 
                    type="text" 
                    value={newMaster.instagram}
                    onChange={e => setNewMaster({...newMaster, instagram: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-incendeia-red"
                    placeholder="@usuario"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">WEBSITE</label>
                  <input 
                    type="text" 
                    value={newMaster.website}
                    onChange={e => setNewMaster({...newMaster, website: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-incendeia-red"
                    placeholder="www.exemplo.com"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5 hover:bg-white/5 transition-colors"
                >
                  {t('CANCELAR', 'CANCELAR')}
                </button>
                <button 
                  onClick={handleAddMaster}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-incendeia-red text-white shadow-lg shadow-incendeia-red/20 hover:bg-red-700 transition-colors"
                >
                  {t('SALVAR', 'GUARDAR')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Master Detail Modal */}
      <AnimatePresence>
        {selectedMaster && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMaster(null)}
              className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 z-[110] rounded-t-[40px] border-t border-incendeia-red/30 p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
              
              <div className="flex flex-col items-center text-center mb-8">
                <img 
                  src={selectedMaster.photoURL || 'https://picsum.photos/seed/mestre/200/200'} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-incendeia-red mb-4 shadow-2xl shadow-incendeia-red/20" 
                  referrerPolicy="no-referrer" 
                />
                <h3 className="text-3xl font-black-ops text-white uppercase">{selectedMaster.name}</h3>
                <p className="text-incendeia-red font-bold uppercase tracking-[0.2em] text-xs mt-1">{selectedMaster.role}</p>
              </div>

              <div className="bg-black/30 p-6 rounded-3xl border border-white/5 mb-8">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('BIOGRAFIA', 'BIOGRAFÍA')}</h4>
                <p className="text-zinc-300 text-sm leading-relaxed font-medium italic">
                  "{selectedMaster.bio}"
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t('REDES SOCIAIS', 'REDES SOCIALES')}</h4>
                
                {selectedMaster.instagram && (
                  <a 
                    href={`https://instagram.com/${selectedMaster.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-2xl border border-white/5 hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-2 rounded-xl">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">{selectedMaster.instagram}</span>
                  </a>
                )}

                {selectedMaster.website && (
                  <a 
                    href={`https://${selectedMaster.website.replace('https://', '').replace('http://', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-2xl border border-white/5 hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="bg-incendeia-red p-2 rounded-xl">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">{selectedMaster.website}</span>
                  </a>
                )}
              </div>

              <button 
                onClick={() => setSelectedMaster(null)}
                className="w-full bg-zinc-800 text-white font-black-ops py-5 rounded-2xl mt-10 uppercase tracking-widest text-sm hover:bg-zinc-700 transition-colors"
              >
                {t('FECHAR', 'CERRAR')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const CalendarView = ({ t, showConfirm }: { 
  t: (pt: string, es: string) => string; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
}) => {
  const { events, addEvent, deleteEvent, user, isAdmin } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    description: '',
    date: '' as any,
    location: '',
    type: 'training'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    
    await addEvent({
      ...newEvent,
      date: new Date(newEvent.date)
    });
    setIsAdding(false);
    setNewEvent({ title: '', description: '', date: '', location: '', type: 'training' });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'training': return <Award className="w-5 h-5 text-blue-400" />;
      case 'workshop': return <Users className="w-5 h-5 text-purple-400" />;
      case 'roda': return <Play className="w-5 h-5 text-incendeia-red" />;
      default: return <Calendar className="w-5 h-5 text-zinc-400" />;
    }
  };

  const handleDeleteEvent = (id: string) => {
    showConfirm(
      t('EXCLUIR EVENTO', 'ELIMINAR EVENTO'),
      t('Deseja excluir este evento?', '¿Desea eliminar este evento?'),
      () => deleteEvent(id)
    );
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('CALENDÁRIO', 'CALENDARIO')}</h2>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-incendeia-red p-3 rounded-2xl shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Calendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">{t('Nenhum evento agendado', 'Ningún evento programado')}</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5 flex gap-5">
              <div className="flex flex-col items-center justify-center bg-zinc-800/50 rounded-2xl p-3 min-w-[60px]">
                <span className="text-xs font-bold text-incendeia-red uppercase">{format(event.date.toDate(), 'MMM', { locale: ptBR })}</span>
                <span className="text-2xl font-black-ops text-white">{format(event.date.toDate(), 'dd')}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getEventIcon(event.type)}
                  <h3 className="text-lg font-bold text-white leading-tight">{event.title}</h3>
                </div>
                <p className="text-zinc-400 text-xs mb-3">{event.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {event.type}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDeleteEvent(event.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                  <Trash className="w-5 h-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 bg-zinc-900 z-[110] rounded-t-[40px] p-8 border-t border-incendeia-red/20">
              <h3 className="text-xl font-black-ops text-white mb-6 uppercase tracking-widest">{t('NOVO EVENTO', 'NUEVO EVENTO')}</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder={t('Título do evento', 'Título del evento')}
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-incendeia-red outline-none"
                />
                <textarea 
                  placeholder={t('Descrição', 'Descripción')}
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-incendeia-red outline-none h-24"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="datetime-local" 
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-incendeia-red outline-none"
                  />
                  <select 
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-incendeia-red outline-none"
                  >
                    <option value="training">{t('Treino', 'Entrenamiento')}</option>
                    <option value="workshop">{t('Workshop', 'Workshop')}</option>
                    <option value="roda">{t('Roda', 'Roda')}</option>
                    <option value="other">{t('Outro', 'Otro')}</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  placeholder={t('Localização', 'Ubicación')}
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-incendeia-red outline-none"
                />
                <button type="submit" className="bg-incendeia-red text-white font-black-ops py-4 rounded-xl mt-4 uppercase tracking-widest">
                  {t('CRIAR EVENTO', 'CREAR EVENTO')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StoreView = ({ t, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { storeItems, isAdmin, addStoreItem, updateStoreItem, deleteStoreItem } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<StoreItem, 'id'>>({ name: '', price: 0, imageUrl: '', category: 'Geral', description: '' });
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = async () => {
    if (!newItem.name || newItem.price <= 0) {
      showAlert(t('Por favor, insira um nome e um preço válido (maior que zero).', 'Por favor, ingrese un nombre e um precio válido (mayor que cero).'));
      return;
    }
    if (editingItemId) {
      await updateStoreItem(editingItemId, newItem);
    } else {
      await addStoreItem({ ...newItem, createdAt: new Date() });
    }
    setShowAddModal(false);
    setEditingItemId(null);
    setNewItem({ name: '', price: 0, imageUrl: '', category: 'Geral', description: '' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `store/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setNewItem(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Error uploading store image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditItem = (p: StoreItem) => {
    setNewItem({ name: p.name, price: Number(p.price), imageUrl: p.imageUrl, category: p.category || 'Geral', description: p.description || '' });
    setEditingItemId(p.id);
    setShowAddModal(true);
  };

  const handleDeleteItem = async (id: string) => {
    showConfirm(
      t('EXCLUIR ITEM', 'ELIMINAR ARTÍCULO'),
      t('Deseja excluir este item?', '¿Desea eliminar este artículo?'),
      () => deleteStoreItem(id)
    );
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('LOJA OFICIAL', 'TIENDA OFICIAL')}</h2>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-3 bg-incendeia-red rounded-2xl text-white shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {storeItems.map((p: StoreItem) => (
          <div key={p.id} className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 group relative">
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button 
                  onClick={() => handleEditItem(p)}
                  className="p-2 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => handleDeleteItem(p.id)}
                  className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedItem(p)}>
              <LazyImage src={p.imageUrl || 'https://picsum.photos/seed/store/300/300'} alt={p.name} className="w-full h-full group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-4 cursor-pointer" onClick={() => setSelectedItem(p)}>
              <h3 className="text-xs font-black-ops text-white uppercase truncate">{p.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-incendeia-red font-bold">R$ {p.price}</span>
                <button className="bg-incendeia-red p-1.5 rounded-lg active:scale-95 transition-transform">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {storeItems.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-zinc-900/30 rounded-[32px] border border-dashed border-white/10">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{t('Nenhum item na loja', 'Ningún artículo en la tienda')}</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/90 z-[150] backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[160] rounded-[32px] border border-white/10 p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{editingItemId ? t('EDITAR ITEM', 'EDITAR ARTÍCULO') : t('NOVO ITEM', 'NUEVO ARTÍCULO')}</h3>
              
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 mb-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-32 h-32 rounded-2xl border-2 border-dashed ${newItem.imageUrl ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group bg-black/30`}
                  >
                    {newItem.imageUrl ? (
                      <img src={newItem.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{t('FOTO DO ITEM', 'FOTO DEL ARTÍCULO')}</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-incendeia-red border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('NOME DO PRODUTO', 'NOMBRE DEL PRODUCTO')}</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-incendeia-red transition-all"
                    placeholder={t('Ex: Camiseta Oficial', 'Ej: Camiseta Oficial')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('PREÇO', 'PRECIO')} (R$)</label>
                    <input 
                      type="number" 
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-incendeia-red transition-all"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('CATEGORIA', 'CATEGORÍA')}</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-incendeia-red transition-all"
                    >
                      <option value="Geral">{t('Geral', 'General')}</option>
                      <option value="Vestuário">{t('Vestuário', 'Vestuario')}</option>
                      <option value="Acessórios">{t('Acessórios', 'Accesorios')}</option>
                      <option value="Instrumentos">{t('Instrumentos', 'Instrumentos')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
                  <textarea 
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-incendeia-red transition-all h-24 resize-none"
                    placeholder={t('Detalhes do produto...', 'Detalles del producto...')}
                  />
                </div>

                <button 
                  onClick={handleAddItem}
                  disabled={isUploading}
                  className="bg-incendeia-red text-white font-black-ops py-4 rounded-xl mt-4 uppercase tracking-widest shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUploading ? t('CARREGANDO...', 'CARGANDO...') : (editingItemId ? t('ATUALIZAR ITEM', 'ACTUALIZAR ARTÍCULO') : t('SALVAR ITEM', 'GUARDAR ARTÍCULO'))}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/95 z-[200] backdrop-blur-xl"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-zinc-900 z-[210] rounded-t-[40px] border-t border-white/10 overflow-hidden flex flex-col"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full z-20" />
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur-md rounded-full text-white z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="aspect-square w-full relative">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                </div>

                <div className="p-8 -mt-12 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-incendeia-red text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">
                        {selectedItem.category}
                      </span>
                      <h3 className="text-3xl font-black-ops text-white uppercase leading-tight">
                        {selectedItem.name}
                      </h3>
                    </div>
                    <div className="bg-incendeia-red/10 border border-incendeia-red/20 px-4 py-2 rounded-2xl">
                      <span className="text-2xl font-bold text-incendeia-red">R$ {selectedItem.price}</span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/5 my-8" />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {t('DESCRIÇÃO DO PRODUTO', 'DESCRIPCIÓN DEL PRODUCTO')}
                    </h4>
                    <p className="text-zinc-300 leading-relaxed">
                      {selectedItem.description || t('Nenhuma descrição disponível.', 'No hay descripción disponible.')}
                    </p>
                  </div>

                  <div className="mt-12 space-y-4">
                    <button className="w-full bg-incendeia-red text-white font-black-ops py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-incendeia-red/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                      <ShoppingBag className="w-6 h-6" />
                      {t('COMPRAR AGORA', 'COMPRAR AHORA')}
                    </button>
                    <button 
                      onClick={() => {
                        const text = `Olá! Tenho interesse no produto: ${selectedItem.name} (R$ ${selectedItem.price})`;
                        window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="w-full bg-zinc-800 text-white font-black-ops py-5 rounded-2xl uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
                    >
                      <MessageSquare className="w-6 h-6 text-green-500" />
                      {t('FALAR COM VENDEDOR', 'HABLAR CON VENDEDOR')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const FinanceView = ({ t, showConfirm, showAlert }: { t: (pt: string, es: string) => string, showConfirm: (title: string, message: string, onConfirm: () => void) => void, showAlert: (message: string) => void }) => {
  const { payments, feeConfigs, allUsers, isAdmin, addPayment, updatePaymentStatus, deletePayment, addFeeConfig, deleteFeeConfig, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'admin'>('dashboard');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddFee, setShowAddFee] = useState(false);
  
  const [newPayment, setNewPayment] = useState({
    userId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
    type: 'monthly' as const,
    description: ''
  });

  const [newFee, setNewFee] = useState({
    name: '',
    amount: 0,
    frequency: 'monthly' as const,
    description: ''
  });

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUser = allUsers.find(u => u.uid === newPayment.userId);
    await addPayment({
      ...newPayment,
      userName: selectedUser?.nickname || selectedUser?.displayName || 'Usuário',
      date: new Date(newPayment.date)
    });
    setShowAddPayment(false);
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFeeConfig(newFee);
    setShowAddFee(false);
  };

  const handleDeletePayment = (id: string) => {
    showConfirm(
      t('EXCLUIR PAGAMENTO', 'ELIMINAR PAGO'),
      t('Deseja excluir este registro de pagamento?', '¿Desea eliminar este registro de pago?'),
      () => deletePayment(id)
    );
  };

  const handleDeleteFee = (id: string) => {
    showConfirm(
      t('EXCLUIR TAXA', 'ELIMINAR TASA'),
      t('Deseja excluir esta configuração de taxa?', '¿Desea eliminar esta configuración de tasa?'),
      () => deleteFeeConfig(id)
    );
  };

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingDues = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0);

  // Dashboard Data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthPayments = payments.filter(p => {
      const pDate = safeToDate(p.date);
      return pDate.getMonth() === month && pDate.getFullYear() === year && p.status === 'paid';
    });
    return {
      name: format(d, 'MMM', { locale: ptBR }),
      total: monthPayments.reduce((acc, p) => acc + p.amount, 0)
    };
  });

  const statusData = [
    { name: t('Pago', 'Pagado'), value: payments.filter(p => p.status === 'paid').length, color: '#22c55e' },
    { name: t('Pendente', 'Pendiente'), value: payments.filter(p => p.status === 'pending').length, color: '#eab308' },
    { name: t('Atrasado', 'Atrasado'), value: payments.filter(p => p.status === 'overdue').length, color: '#ef4444' },
  ];

  const generateReport = () => {
    const headers = ['ID', 'Aluno', 'Valor', 'Data', 'Status', 'Tipo', 'Descrição'];
    const rows = payments.map(p => [
      p.id,
      p.userName,
      p.amount.toFixed(2),
      format(safeToDate(p.date), 'dd/MM/yyyy'),
      p.status,
      p.type,
      p.description
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_financeiro_${format(new Date(), 'dd_MM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate upcoming dues (simplified: check monthly fees for current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyFees = feeConfigs.filter(f => f.frequency === 'monthly');
  const upcomingDues = monthlyFees.filter(fee => {
    const hasPaid = payments.some(p => {
      const pDate = safeToDate(p.date);
      return p.status === 'paid' && 
             p.type === 'monthly' && 
             pDate.getMonth() === currentMonth && 
             pDate.getFullYear() === currentYear &&
             p.description.includes(fee.name);
    });
    return !hasPaid;
  });

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('FINANCEIRO', 'FINANCIERO')}</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t('Gestão de Mensalidades e Taxas', 'Gestión de Mensualidades y Tasas')}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={generateReport}
              className="bg-zinc-800 p-3 rounded-2xl border border-white/5 active:scale-95 transition-all text-zinc-400 hover:text-white"
              title={t('Gerar Relatório', 'Generar Informe')}
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowAddPayment(true)}
              className="bg-incendeia-red p-3 rounded-2xl shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6 bg-zinc-900/50 p-1 rounded-2xl border border-white/5 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('DASHBOARD', 'DASHBOARD')}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('PAGAMENTOS', 'PAGOS')}
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-incendeia-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('CONFIGURAÇÕES', 'CONFIGURACIONES')}
          </button>
        </div>
      )}

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('TOTAL PAGO', 'TOTAL PAGADO')}</p>
              <p className="text-xl font-black-ops text-green-500">R$ {totalPaid.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('PENDENTE', 'PENDIENTE')}</p>
              <p className="text-xl font-black-ops text-incendeia-red">R$ {pendingDues.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              {t('RECEITA MENSAL', 'INGRESOS MENSUALES')}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChartIcon className="w-3 h-3" />
              {t('STATUS DOS PAGAMENTOS', 'ESTADO DE LOS PAGOS')}
            </h3>
            <div className="h-48 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 pr-4">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!isAdmin && upcomingDues.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('PRÓXIMOS VENCIMENTOS', 'PRÓXIMOS VENCIMIENTOS')}</h3>
              <div className="flex flex-col gap-3">
                {upcomingDues.map(due => (
                  <div key={due.id} className="bg-incendeia-red/10 border border-incendeia-red/30 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-incendeia-red" />
                      <div>
                        <p className="text-xs font-bold uppercase text-white">{due.name}</p>
                        <p className="text-[8px] text-zinc-500 uppercase font-bold">{t('Vence este mês', 'Vence este mes')}</p>
                      </div>
                    </div>
                    <p className="font-black-ops text-sm text-white">R$ {due.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'history' ? (
        <div className="flex flex-col gap-4">
          {payments.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 italic text-sm">
              {t('Nenhum registro encontrado.', 'Ningún registro encontrado.')}
            </div>
          ) : (
            payments.map(p => (
              <div key={p.id} className="bg-zinc-900/30 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-incendeia-red/10 text-incendeia-red'}`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-white">{p.type === 'monthly' ? t('Mensalidade', 'Mensualidad') : p.description}</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">
                      {isAdmin ? p.userName : format(safeToDate(p.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black-ops text-sm text-white">R$ {p.amount.toFixed(2)}</p>
                  <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-900/30 text-green-500' : 'bg-incendeia-red/30 text-incendeia-red'}`}>
                    {t(p.status.toUpperCase(), p.status.toUpperCase())}
                  </span>
                </div>
                {isAdmin && (
                  <div className="hidden group-hover:flex gap-2 ml-4">
                    {p.status !== 'paid' && (
                      <button onClick={() => updatePaymentStatus(p.id, 'paid')} className="p-2 bg-green-500/20 text-green-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDeletePayment(p.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('TAXAS PADRÃO', 'TASAS ESTÁNDAR')}</h3>
            <button onClick={() => setShowAddFee(true)} className="text-incendeia-red text-[10px] font-bold uppercase tracking-widest hover:underline">{t('+ ADICIONAR', '+ AÑADIR')}</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {feeConfigs.map(f => (
              <div key={f.id} className="bg-zinc-900/30 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase text-white">{f.name}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">{t(f.frequency.toUpperCase(), f.frequency.toUpperCase())}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black-ops text-sm text-incendeia-red">R$ {f.amount.toFixed(2)}</p>
                  <button onClick={() => handleDeleteFee(f.id)} className="p-2 text-zinc-600 hover:text-incendeia-red transition-colors"><Trash className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddPayment(false)} className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[110] rounded-[32px] border border-white/10 p-8 shadow-2xl">
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{t('REGISTRAR PAGAMENTO', 'REGISTRAR PAGO')}</h3>
              <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('ALUNO', 'ALUMNO')}</label>
                  <select 
                    required
                    value={newPayment.userId}
                    onChange={e => setNewPayment({...newPayment, userId: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                  >
                    <option value="">{t('Selecionar Aluno', 'Seleccionar Alumno')}</option>
                    {allUsers.map(u => (
                      <option key={u.uid} value={u.uid}>{u.nickname || u.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('VALOR (R$)', 'VALOR (R$)')}</label>
                    <input 
                      type="number" 
                      required
                      value={newPayment.amount}
                      onChange={e => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DATA', 'FECHA')}</label>
                    <input 
                      type="date" 
                      required
                      value={newPayment.date}
                      onChange={e => setNewPayment({...newPayment, date: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('TIPO', 'TIPO')}</label>
                    <select 
                      value={newPayment.type}
                      onChange={e => setNewPayment({...newPayment, type: e.target.value as any})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    >
                      <option value="monthly">{t('Mensalidade', 'Mensualidad')}</option>
                      <option value="event">{t('Evento', 'Evento')}</option>
                      <option value="other">{t('Outro', 'Otro')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('STATUS', 'STATUS')}</label>
                    <select 
                      value={newPayment.status}
                      onChange={e => setNewPayment({...newPayment, status: e.target.value as any})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    >
                      <option value="pending">{t('Pendente', 'Pendiente')}</option>
                      <option value="paid">{t('Pago', 'Pagado')}</option>
                      <option value="overdue">{t('Atrasado', 'Atrasado')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
                  <input 
                    type="text" 
                    value={newPayment.description}
                    onChange={e => setNewPayment({...newPayment, description: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                  />
                </div>
                <button type="submit" className="bg-incendeia-red text-white font-black-ops py-4 rounded-xl mt-4 uppercase tracking-widest shadow-lg shadow-incendeia-red/20">
                  {t('SALVAR REGISTRO', 'GUARDAR REGISTRO')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Fee Modal */}
      <AnimatePresence>
        {showAddFee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddFee(false)} className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[110] rounded-[32px] border border-white/10 p-8 shadow-2xl">
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{t('CONFIGURAR TAXA', 'CONFIGURAR TASA')}</h3>
              <form onSubmit={handleAddFee} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('NOME DA TAXA', 'NOMBRE DE LA TASA')}</label>
                  <input 
                    type="text" 
                    required
                    value={newFee.name}
                    onChange={e => setNewFee({...newFee, name: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    placeholder="Ex: Mensalidade Adulto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('VALOR (R$)', 'VALOR (R$)')}</label>
                    <input 
                      type="number" 
                      required
                      value={newFee.amount}
                      onChange={e => setNewFee({...newFee, amount: parseFloat(e.target.value)})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('FREQUÊNCIA', 'FRECUENCIA')}</label>
                    <select 
                      value={newFee.frequency}
                      onChange={e => setNewFee({...newFee, frequency: e.target.value as any})}
                      className="bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red"
                    >
                      <option value="monthly">{t('Mensal', 'Mensual')}</option>
                      <option value="one-time">{t('Única', 'Única')}</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="bg-incendeia-red text-white font-black-ops py-4 rounded-xl mt-4 uppercase tracking-widest shadow-lg shadow-incendeia-red/20">
                  {t('SALVAR CONFIGURAÇÃO', 'GUARDAR CONFIGURACIÓN')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatView = ({ t, messages, sendMessage, deleteMessage, user, isAdmin, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  messages: ChatMessage[]; 
  sendMessage: (text?: string, imageUrl?: string) => Promise<void>; 
  deleteMessage: (id: string) => Promise<void>; 
  user: any; 
  isAdmin: boolean; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { reactToMessage } = useAuth();
  const [msgText, setMsgText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!msgText.trim()) return;
    await sendMessage(msgText);
    setMsgText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `chats/images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await sendMessage('', url);
    } catch (error) {
      console.error("Error uploading chat image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = (id: string) => {
    showConfirm(
      t('EXCLUIR MENSAGEM', 'ELIMINAR MENSAJE'),
      t('Deseja excluir esta mensagem?', '¿Desea eliminar este mensaje?'),
      () => deleteMessage(id)
    );
  };

  const handleLongPressStart = (messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      setShowEmojiMenu(messageId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const emojis = ['🔥', '👏', '💪', '❤️', '😂', '😮'];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] p-6">
      <h2 className="text-2xl font-black-ops text-incendeia-red mb-8 uppercase">{t('CHAT DA RODA', 'CHAT DE LA RODA')}</h2>
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-sm">
            {t('Nenhuma mensagem ainda...', 'Ningún mensaje aún...')}
          </div>
        )}
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.authorUid === user?.uid ? 'items-end' : 'items-start'} group relative`}
            onMouseDown={() => handleLongPressStart(m.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(m.id)}
            onTouchEnd={handleLongPressEnd}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-bold text-zinc-500 uppercase">{m.authorName}</span>
              {isAdmin && (
                <button 
                  onClick={() => handleDeleteMessage(m.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm relative ${m.authorUid === user?.uid ? 'bg-incendeia-red text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-300 rounded-tl-none'}`}>
              {m.imageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                  <LazyImage src={m.imageUrl} alt="Chat image" className="w-full h-auto max-h-60 object-cover" />
                </div>
              )}
              {m.text}

              {/* Reactions Display */}
              {m.reactions && Object.keys(m.reactions).length > 0 && (
                <div className={`absolute -bottom-2 ${m.authorUid === user?.uid ? 'right-0' : 'left-0'} flex gap-1`}>
                  {Object.entries(m.reactions).map(([emoji, users]: [string, string[]]) => (
                    <button 
                      key={emoji}
                      onClick={() => reactToMessage(m.id, emoji)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border ${users.includes(user?.uid || '') ? 'bg-incendeia-red/20 border-incendeia-red text-white' : 'bg-zinc-900 border-white/10 text-zinc-400'}`}
                    >
                      <span>{emoji}</span>
                      <span>{users.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emoji Menu */}
            <AnimatePresence>
              {showEmojiMenu === m.id && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowEmojiMenu(null)}
                    className="fixed inset-0 z-[100]"
                  />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 10 }}
                    className={`absolute z-[110] -top-12 ${m.authorUid === user?.uid ? 'right-0' : 'left-0'} bg-zinc-900 border border-white/10 p-1.5 rounded-2xl shadow-2xl flex gap-1`}
                  >
                    {emojis.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => {
                          reactToMessage(m.id, emoji);
                          setShowEmojiMenu(null);
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-lg active:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-zinc-800 p-3 rounded-xl active:scale-95 transition-transform border border-white/5 text-zinc-400 hover:text-white disabled:opacity-50"
        >
          {isUploading ? <div className="w-5 h-5 border-2 border-incendeia-red border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
        <input 
          type="text" 
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('Mensagem...', 'Mensaje...')} 
          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-incendeia-red" 
        />
        <button onClick={handleSend} className="bg-incendeia-red p-3 rounded-xl active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const UserManagementView = ({ t, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { allUsers, updateOtherUserProfile, deleteOtherUserProfile } = useAuth();
  const handleRoleChange = async (userId: string, newRole: string) => {
    showConfirm(
      t('ALTERAR CARGO', 'CAMBIAR CARGO'),
      t(`Alterar cargo para ${newRole}?`, `¿Cambiar rol a ${newRole}?`),
      () => updateOtherUserProfile(userId, { role: newRole as any })
    );
  };

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      t('EXCLUIR PERFIL', 'ELIMINAR PERFIL'),
      t('Deseja excluir permanentemente este perfil? (A conta de login permanecerá ativa)', '¿Desea eliminar permanentemente este perfil? (La cuenta de login permanecerá activa)'),
      () => deleteOtherUserProfile(userId)
    );
  };

  return (
    <div className="p-6 pb-24">
      <h2 className="text-2xl font-black-ops text-incendeia-red mb-8 uppercase">{t('GERENCIAR USUÁRIOS', 'GESTIONAR USUARIOS')}</h2>
      <div className="flex flex-col gap-4">
        {allUsers.map((u: UserProfile) => (
          <div key={u.uid} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LazyImage src={u.photoURL || "https://picsum.photos/seed/user/100/100"} alt={u.nickname || u.displayName} className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-sm font-bold text-white">{u.nickname || u.displayName}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">{u.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={u.role}
                onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white uppercase outline-none focus:border-incendeia-red"
              >
                <option value="member">{t('MEMBRO', 'MIEMBRO')}</option>
                <option value="admin">{t('ADMIN', 'ADMIN')}</option>
              </select>
              <button 
                onClick={() => handleDeleteUser(u.uid)}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Header = ({ setView, now, locale, logout, t }: { 
  setView: (view: View) => void; 
  now: Date; 
  locale: Locale; 
  logout: () => void; 
  t: (pt: string, es: string) => string; 
}) => (
  <div className="bg-premium-black/90 backdrop-blur-md border-b border-incendeia-red/20 p-4 sticky top-0 z-50 flex items-center justify-between">
    <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft className="w-6 h-6 text-incendeia-red" /></button>
    <div className="flex items-center gap-3">
      <LazyImage 
        src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" 
        alt="Logo" 
        className="w-10 h-10"
        imgClassName="mix-blend-screen"
        objectFit="contain"
      />
      <div className="flex flex-col">
        <div className="flex gap-1 font-black-ops text-[10px] leading-none tracking-tighter">
          <span className="text-flag-br">INCENDEIA</span>
          <span className="text-flag-es">CAPOEIRA</span>
        </div>
        <div className="text-[7px] font-black-ops text-zinc-500 uppercase mt-0.5">{format(now, "EEEE, dd/MM/yyyy HH:mm", { locale })}</div>
      </div>
    </div>
    <button onClick={logout} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><LogOut className="w-6 h-6 text-incendeia-red" /></button>
  </div>
);

// --- Main App Component ---

const SmokeEffect = () => {
  const particles = Array.from({ length: 20 });
  return (
    <div className="smoke-container">
      {particles.map((_, i) => (
        <div 
          key={i} 
          className="smoke-particle" 
          style={{ 
            '--duration': `${Math.random() * 10 + 5}s`,
            '--start-x': `${Math.random() * 100}%`,
            '--end-x': `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), 2500);
    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[200] bg-premium-black flex flex-col items-center justify-center overflow-hidden"
    >
      <SmokeEffect />
      
      {/* Background Capoeirista */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, x: -100 }}
        animate={{ opacity: 0.15, scale: 1, x: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <img 
          src="https://i.ibb.co/G3mXQp6/capoeira-silhouette.png" 
          alt="Capoeirista" 
          className="w-[120%] h-[120%] object-contain animate-ginga opacity-40 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Rotating Logo with Fire */}
      <div className="relative z-10">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
          className="relative"
        >
          {/* Fire Ring */}
          <div className="absolute -inset-8 rounded-full border-4 border-incendeia-red/30 animate-fire fire-glow" />
          <div className="absolute -inset-12 rounded-full border-2 border-incendeia-orange/20 animate-fire [animation-delay:-2s]" />
          
          <img 
            src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" 
            alt="Logo" 
            className="w-48 h-48 object-contain mix-blend-screen drop-shadow-[0_0_30px_rgba(204,0,0,0.8)]" 
            referrerPolicy="no-referrer" 
          />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-12 text-center z-10"
      >
        <h1 className="text-4xl font-black-ops tracking-tighter">
          <span className="text-flag-br">INCENDEIA</span>
          <br />
          <span className="text-flag-es">CAPOEIRA</span>
        </h1>
        <div className="h-1 w-48 bg-gradient-to-r from-transparent via-incendeia-red to-transparent mt-4 mx-auto" />
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const { 
    user, 
    profile, 
    loading, 
    login: loginFn, 
    register: registerFn, 
    loginWithGoogle, 
    loginWithFacebook, 
    logout, 
    updateProfile, 
    updateOtherUserProfile,
    isAdmin, 
    messages, 
    sendMessage, 
    deleteMessage,
    deleteGalleryItem,
    addStoreItem,
    deleteStoreItem,
    addMaster,
    deleteMaster,
    deleteOtherUserProfile,
    payments, 
    feeConfigs, 
    storeItems,
    masters,
    allUsers 
  } = useAuth();
  const [lang, setLang] = useState<Language>('pt');
  const [view, setView] = useState<View>('splash');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'member' | 'admin'>('member');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('lastSeenChat');
    return saved ? parseInt(saved, 10) : Date.now();
  });
  const [showToast, setShowToast] = useState<{ text: string, author: string } | null>(null);

  useEffect(() => {
    if (view === 'chat') {
      const nowTs = Date.now();
      setLastSeenTimestamp(nowTs);
      localStorage.setItem('lastSeenChat', nowTs.toString());
      setHasNewMessages(false);
      setShowToast(null);
    }
  }, [view]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Don't notify for own messages
      if (latestMessage.authorUid === user?.uid) return;

      const messageTs = latestMessage.createdAt?.toMillis?.() || (latestMessage.createdAt?.seconds * 1000) || Date.now();
      
      if (messageTs > lastSeenTimestamp) {
        if (view !== 'chat') {
          setHasNewMessages(true);
          setShowToast({ text: latestMessage.text, author: latestMessage.authorName });
          
          // Auto-hide toast after 5 seconds
          const timer = setTimeout(() => setShowToast(null), 5000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [messages, view, lastSeenTimestamp, user?.uid]);

  // Auth form state removed from App to isolate re-renders
  
  // Form states
  const [initialEditData, setInitialEditData] = useState({
    nickname: '',
    age: 0,
    capoeiraTime: '',
    bio: '',
    graduation: 'Iniciante',
    photoURL: '',
    birthDate: '',
    feedback: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && (view === 'login' || view === 'auth')) setView('home');
    if (!user && view !== 'login' && view !== 'auth') setView('login');
  }, [user]);

  useEffect(() => {
    if (profile) {
      setInitialEditData({
        nickname: profile.nickname || '',
        age: profile.age || 0,
        capoeiraTime: profile.capoeiraTime || '',
        bio: profile.bio || '',
        graduation: profile.graduation || 'Iniciante',
        photoURL: profile.photoURL || '',
        birthDate: profile.birthDate || '',
        feedback: profile.feedback || ''
      });
    }
  }, [profile]);

  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean, message: string } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const showAlert = (message: string) => {
    setAlertModal({ show: true, message });
  };

  const t = (pt: string, es: string) => lang === 'pt' ? pt : es;
  const locale = lang === 'pt' ? ptBR : es;

  const handleSaveProfile = async (data: UserProfile) => {
    try {
      await updateProfile(data);
      setView('profile');
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleAuth = async (nickname: string, password: string, photoURL?: string) => {
    try {
      if (authMode === 'login') {
        await loginFn(nickname, password);
      } else {
        await registerFn(nickname, password, photoURL || '', authRole);
      }
      setView('home');
      return null;
    } catch (error: any) {
      console.error("Auth error:", error);
      return (error as any).message || "Erro na autenticação";
    }
  };

  if (loading) return <div className="min-h-screen bg-premium-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-incendeia-red border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-premium-black relative">
      <AnimatePresence mode="wait">
        {view === 'splash' ? (
          <SplashScreen key="splash" onComplete={() => setView(user ? 'home' : 'login')} />
        ) : view === 'login' ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginView t={t} setAuthRole={setAuthRole} setView={setView} setLang={setLang} setAuthMode={setAuthMode} />
          </motion.div>
        ) : view === 'auth' ? (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuthView 
              t={t} 
              setView={setView} 
              authRole={authRole} 
              authMode={authMode} 
              setAuthMode={setAuthMode}
              handleAuth={handleAuth}
            />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
            <Header setView={setView} now={now} locale={locale} logout={logout} t={t} />
            
            {/* New Message Toast */}
            <AnimatePresence>
              {showToast && (
                <motion.div 
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  onClick={() => setView('chat')}
                  className="fixed top-20 left-4 right-4 bg-zinc-900/95 border border-incendeia-red/30 p-4 rounded-2xl z-[100] shadow-2xl backdrop-blur-md flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="bg-incendeia-red/20 p-2 rounded-full">
                    <MessageSquare className="w-5 h-5 text-incendeia-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-incendeia-red uppercase tracking-widest leading-none mb-1">{showToast.author}</p>
                    <p className="text-white text-sm truncate">{showToast.text}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 rotate-180" />
                </motion.div>
              )}
            </AnimatePresence>

            {view === 'home' && <HomeView t={t} setView={setView} profile={profile} hasNewMessages={hasNewMessages} />}
            {view === 'profile' && <ProfileView t={t} setView={setView} profile={profile} logout={logout} showConfirm={showConfirm} />}
            {view === 'edit-profile' && <EditProfileView t={t} initialData={profile as UserProfile} handleSaveProfile={handleSaveProfile} setView={setView} />}
            {view === 'gallery' && <GalleryView t={t} setView={setView} isAdmin={isAdmin} showConfirm={showConfirm} showAlert={showAlert} />}
            {view === 'masters' && <MastersView t={t} showConfirm={showConfirm} />}
            {view === 'calendar' && <CalendarView t={t} showConfirm={showConfirm} />}
            {view === 'store' && <StoreView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
            {view === 'finance' && <FinanceView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
            {view === 'users' && <UserManagementView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
            {view === 'chat' && <ChatView t={t} messages={messages} sendMessage={sendMessage} deleteMessage={deleteMessage} user={user} isAdmin={isAdmin} showConfirm={showConfirm} showAlert={showAlert} />}
            
            {/* Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-incendeia-red/20 p-4 flex justify-around items-center z-50">
              <button onClick={() => setView('home')} className={`p-2 rounded-full transition-all ${view === 'home' ? 'bg-incendeia-red scale-110' : 'text-zinc-500'}`}>
                <Home className="w-6 h-6" />
              </button>
              <button onClick={() => setView('chat')} className={`p-2 rounded-full transition-all relative ${view === 'chat' ? 'bg-incendeia-red scale-110' : 'text-zinc-500'}`}>
                <MessageSquare className="w-6 h-6" />
                {hasNewMessages && view !== 'chat' && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-white border-2 border-incendeia-red rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                )}
              </button>
              <button onClick={() => setView('store')} className={`p-2 rounded-full transition-all ${view === 'store' ? 'bg-incendeia-red scale-110' : 'text-zinc-500'}`}>
                <ShoppingBag className="w-6 h-6" />
              </button>
              <button onClick={() => setView('profile')} className={`p-2 rounded-full transition-all ${view === 'profile' || view === 'edit-profile' ? 'bg-incendeia-red scale-110' : 'text-zinc-500'}`}>
                <User className="w-6 h-6" />
              </button>
              <button onClick={() => setIsMenuOpen(true)} className="p-2 text-zinc-500">
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
              {confirmModal?.show && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(null)} className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[210] rounded-[32px] border border-white/10 p-8 shadow-2xl">
                    <h3 className="text-xl font-black-ops text-white uppercase mb-4">{confirmModal.title}</h3>
                    <p className="text-zinc-400 text-sm mb-8">{confirmModal.message}</p>
                    <div className="flex gap-4">
                      <Button variant="danger" className="flex-1" onClick={() => setConfirmModal(null)}>{t('CANCELAR', 'CANCELAR')}</Button>
                      <Button className="flex-1" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>{t('CONFIRMAR', 'CONFIRMAR')}</Button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Alert Modal */}
            <AnimatePresence>
              {alertModal?.show && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAlertModal(null)} className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm" />
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[210] rounded-[32px] border border-white/10 p-8 shadow-2xl">
                    <h3 className="text-xl font-black-ops text-white uppercase mb-4">{t('AVISO', 'AVISO')}</h3>
                    <p className="text-zinc-400 text-sm mb-8">{alertModal.message}</p>
                    <Button className="w-full" onClick={() => setAlertModal(null)}>{t('OK', 'OK')}</Button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Sidebar Overlay */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 bg-black/80 z-[60]"
                  />
                  <motion.div 
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    className="fixed top-0 left-0 bottom-0 w-64 bg-zinc-900 z-[70] p-6 border-r border-incendeia-red/20"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <img src="https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png" className="w-12 h-12" referrerPolicy="no-referrer" />
                      <button onClick={() => setIsMenuOpen(false)}><X className="w-6 h-6 text-incendeia-red" /></button>
                    </div>
                    <nav className="flex flex-col gap-4">
                      {[
                        { id: 'home', icon: Home, label: t('HOME', 'INICIO') },
                        { id: 'chat', icon: MessageSquare, label: t('CHAT', 'CHAT'), hasNotification: hasNewMessages },
                        { id: 'calendar', icon: Calendar, label: t('CALENDÁRIO', 'CALENDARIO') },
                        { id: 'profile', icon: User, label: t('PERFIL', 'PERFIL') },
                        { id: 'gallery', icon: ImageIcon, label: t('GALERIA', 'GALERIA') },
                        { id: 'masters', icon: Users, label: t('MESTRES', 'MAESTROS') },
                        { id: 'store', icon: ShoppingBag, label: t('LOJA', 'TIENDA') },
                        { id: 'finance', icon: DollarSign, label: t('FINANCEIRO', 'FINANCIERO') },
                        isAdmin && { id: 'users', icon: Users, label: t('USUÁRIOS', 'USUARIOS') },
                      ].filter((item): item is any => !!item).map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => { setView(item.id as View); setIsMenuOpen(false); }}
                          className="flex items-center justify-between p-3 hover:bg-incendeia-red/10 rounded-xl transition-colors text-zinc-300 hover:text-white font-black-ops text-sm group"
                        >
                          <div className="flex items-center gap-4">
                            <item.icon className="w-5 h-5 text-incendeia-red" />
                            {item.label}
                          </div>
                          {item.hasNotification && (
                            <span className="w-2 h-2 bg-incendeia-red rounded-full animate-pulse shadow-[0_0_5px_rgba(255,0,0,0.5)]" />
                          )}
                        </button>
                      ))}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
