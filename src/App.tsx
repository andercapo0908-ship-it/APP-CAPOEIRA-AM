import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  AIChatMessage,
  Language,
  View,
  AppConfig,
  Graduation,
  Branch
} from './types';
import { storage, db } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { addDoc, collection, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Home, 
  User, 
  Image as ImageIcon, 
  Users, 
  Award, 
  Bell,
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
  Banana,
  Link,
  Heart,
  Smile,
  Send,
  MessageCircle,
  Sparkles,
  Palette,
  Settings,
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
  Download,
  Volume2,
  Clock,
  Phone,
  LayoutDashboard,
  Upload
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  aiChat, 
  textToSpeech, 
  analyzeGalleryContent 
} from './services/geminiService';
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

const RotatingArcs = ({ size = "md", color1 = "var(--color-incendeia-red)", color2 = "var(--color-incendeia-orange)" }: { size?: "sm" | "md" | "lg"; color1?: string; color2?: string }) => {
  const insets = {
    sm: { arc1: "-inset-1", arc2: "-inset-2" },
    md: { arc1: "-inset-2", arc2: "-inset-4" },
    lg: { arc1: "-inset-4", arc2: "-inset-8" }
  };
  
  const currentInsets = insets[size];
  
  return (
    <>
      <motion.div 
        animate={{ rotateX: [0, 360], rotateY: [0, 180], rotateZ: [0, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className={`absolute ${currentInsets.arc1} border-2 rounded-full opacity-80 pointer-events-none`}
        style={{ 
          borderColor: color2,
          boxShadow: `0 0 10px ${color2}, inset 0 0 10px ${color2}`,
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      />
      <motion.div 
        animate={{ rotateX: [360, 0], rotateY: [180, 0], rotateZ: [360, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={`absolute ${currentInsets.arc2} border-2 rounded-full opacity-60 pointer-events-none`}
        style={{ 
          borderColor: color1,
          boxShadow: `0 0 8px ${color1}, inset 0 0 8px ${color1}`,
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      />
    </>
  );
};

const MainTitle = ({ size = "lg" }: { size?: "sm" | "lg" }) => {
  const containerClass = size === "lg" ? "text-5xl md:text-7xl" : "text-3xl md:text-5xl";
  const proClass = size === "lg" ? "text-lg md:text-xl" : "text-[10px] md:text-xs";
  const capoeiraClass = size === "lg" ? "text-4xl md:text-6xl" : "text-2xl md:text-4xl";

  return (
    <div className="flex flex-col items-center font-suez tracking-tight py-4">
      <div className="relative text-shine-effect">
        <span className={`${containerClass} text-professional-texture uppercase`}>
          INCENDEIA
        </span>
      </div>
      <div className="flex items-center gap-2 -mt-1 md:-mt-3">
        <span className={`${capoeiraClass} text-professional-texture uppercase text-shine-effect`}>
          CAPOEIRA
        </span>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white px-2 py-0.5 rounded border-2 border-incendeia-orange shadow-[0_0_15px_rgba(255,102,0,0.5)] transform -rotate-12"
        >
          <span className={`${proClass} text-incendeia-red font-black tracking-tighter`}>
            PRO
          </span>
        </motion.div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      let errorMessage = "Ocorreu um erro inesperado.";
      const rawError = this.state.error.message;
      
      try {
        const errorObj = JSON.parse(rawError);
        if (errorObj.error === "Missing or insufficient permissions." || 
            (typeof errorObj.error === 'string' && errorObj.error.toLowerCase().includes("permission"))) {
          errorMessage = "Você não tem permissão para acessar este recurso. Tente recarregar a página.";
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        } else {
          errorMessage = rawError;
        }
      } catch (e) {
        // Not a JSON error
        if (rawError.toLowerCase().includes("permission") || rawError.toLowerCase().includes("insufficient")) {
          errorMessage = "Você não tem permissão para acessar este recurso. Tente recarregar a página.";
        } else {
          errorMessage = rawError;
        }
      }

      return (
        <div className="min-h-screen bg-premium-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-incendeia-red rounded-full flex items-center justify-center mb-6 animate-pulse">
            <X className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black-ops text-white uppercase mb-4">OPS! ALGO DEU ERRADO</h2>
          <p className="text-zinc-400 mb-8 max-w-md">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-incendeia-red px-8 py-3 rounded-xl text-white font-black-ops uppercase tracking-widest hover:bg-red-700 transition-all"
          >
            RECARREGAR APP
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const safeToDate = (date: unknown): Date => {
  if (!date) return new Date();
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
    return (date as any).toDate();
  }
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : new Date();
  }
  if (typeof date === 'number') return new Date(date);
  return new Date();
};

const LazyImage = ({ src, alt, className, objectFit = 'cover', imgClassName = '' }: { src: string | null | undefined; alt: string; className?: string; objectFit?: 'cover' | 'contain'; imgClassName?: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoading(false);
    }
  }, [src]);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800/50 ${className}`}>
        <ImageIcon className="w-8 h-8 text-zinc-600 opacity-20" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-800/50 animate-pulse flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-incendeia-orange/30 border-t-incendeia-orange rounded-full animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        src={src}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => { setIsLoading(false); setError(true); }}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${imgClassName} transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const LazyVideo = ({ src, className, objectFit = 'cover', controls = false, autoPlay = false }: { src: string; className?: string; objectFit?: 'cover' | 'contain'; controls?: boolean; autoPlay?: boolean }) => (
  <video 
    src={src} 
    controls={controls}
    autoPlay={autoPlay}
    muted={autoPlay}
    playsInline
    className={`${className} ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
  />
);

const Footer = ({ t }: { t: (pt: string, es: string) => string }) => {
  return (
    <div className="mt-8 py-4 flex flex-col items-center z-10 opacity-30">
      <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em] text-center">
        incendeia capoeira pro app oficial
      </p>
    </div>
  );
};

const DynamicStyles = ({ config }: { config: AppConfig | null }) => {
  if (!config) return null;
  const primaryColor = config.primaryColor || '#CC0000';
  const borderRadius = config.uiStyle?.borderRadius || '16px';
  const fontFamily = config.fontFamily || 'font-black-ops';

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --color-incendeia-red: ${primaryColor};
        --app-border-radius: ${borderRadius};
        --app-font-family: var(--${fontFamily});
      }
      .rounded-xl, .rounded-full { border-radius: ${borderRadius} !important; }
      .rounded-2xl { border-radius: calc(${borderRadius} * 1.25) !important; }
      .rounded-3xl { border-radius: calc(${borderRadius} * 1.5) !important; }
      .button-dynamic { border-radius: ${borderRadius} !important; }
      
      .font-black-ops, h1, h2, h3, .uppercase { 
        font-family: var(--${fontFamily}), var(--font-black-ops) !important; 
      }
      
      .bg-incendeia-red { background-color: ${primaryColor} !important; }
      .text-incendeia-red { color: ${primaryColor} !important; }
      .border-incendeia-red { border-color: ${primaryColor} !important; }
      
      .distressed-red {
        background-color: ${primaryColor} !important;
      }
      
      /* Neon effect if enabled */
      ${config.uiStyle?.buttonStyle === 'neon' ? `
        .button-dynamic {
          box-shadow: 0 0 15px ${primaryColor}80;
          text-shadow: 0 0 5px rgba(255,255,255,0.8);
        }
      ` : ''}
      
      /* Glassmorphism if enabled */
      ${config.uiStyle?.buttonStyle === 'glass' ? `
        .button-dynamic {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }
      ` : ''}
    `}} />
  );
};

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
  const size = small ? "px-2.5 py-1 text-[9px] rounded-lg" : "px-6 py-2.5 text-base rounded-xl";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${size} ${className} button-dynamic`}
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
  small = false,
  shine = false
}: { 
  children: React.ReactNode; 
  onClick?: (e: React.MouseEvent) => void; 
  className?: string;
  t: (pt: string, es: string) => string;
  jaguar?: boolean;
  small?: boolean;
  shine?: boolean;
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
      className={`distressed-red ${small ? 'py-1.5 px-5' : 'py-3 px-8'} rounded-full transition-all active:scale-95 group relative overflow-hidden ${className} button-dynamic`}
    >
      <span className={`relative z-20 ${small ? 'text-xs' : 'text-xl'} font-black-ops text-white uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>
        {children}
      </span>
      {jaguar && (
        <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply invert bg-[url('https://www.transparenttextures.com/patterns/leopard.png')]"></div>
      )}
      {shine && (
        <motion.div 
          animate={{ x: ['-200%', '300%'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[30deg] z-10 pointer-events-none"
        />
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

const TestDbView = ({ setView }: { setView: (view: View) => void }) => {
  const [status, setStatus] = useState("Pronto para começar!");
  const [nomeArquivo, setNomeArquivo] = useState("");

  const testarConexao = async () => {
    try {
      setStatus("Verificando conexão com o projeto...");
      // We test by reading the config - if it fails, the connection or rules are wrong
      const configRef = collection(db, "config");
      const snapshot = await getDocs(query(configRef, limit(1)));
      setStatus("✅ CONEXÃO ESTABELECIDA! O App está comunicando com o Firebase.");
    } catch (error) {
      console.error(error);
      setStatus("❌ Falha na conexão. Verifique as configurações do Firebase.");
    }
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }} className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex justify-start mb-4 max-w-lg mx-auto">
        <button onClick={() => setView('profile')} className="text-[#eab308] flex items-center gap-2 font-bold uppercase text-xs">
          <ChevronLeft className="w-4 h-4" /> Voltar ao Perfil
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        <header style={{ borderBottom: '2px solid #eab308', paddingBottom: '15px', marginBottom: '30px' }}>
          <h1 style={{ color: '#eab308', margin: 0, fontSize: '24px', fontWeight: '900' }}>DIAGNÓSTICO INCENDEIA</h1>
          <p style={{ color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Verificação de Infraestrutura</p>
        </header>

        <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-[#eab308]" />
          </div>
          
          <h3 style={{ marginBottom: '20px' }} className="text-sm font-bold text-zinc-300 h-10 flex items-center justify-center uppercase tracking-wider">{status}</h3>
          
          <button 
            onClick={testarConexao}
            style={{ 
              backgroundColor: '#eab308', 
              color: '#000', 
              border: 'none', 
              padding: '16px', 
              fontWeight: '900', 
              borderRadius: '12px', 
              width: '100%',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
            className="hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
          >
            Executar Teste de Pulso
          </button>
        </div>

        <footer style={{ marginTop: '40px', color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="font-bold">
          Configuração: {firebaseConfig.projectId}
        </footer>
      </div>
    </div>
  );
};

const LoginView = ({ t, setAuthRole, setView, setLang, setAuthMode, appConfig }: { 
  t: (pt: string, es: string) => string; 
  setAuthRole: (role: 'member' | 'admin') => void; 
  setView: (view: View) => void; 
  setLang: (lang: Language) => void; 
  setAuthMode: (mode: 'login' | 'register') => void; 
  appConfig: AppConfig | null;
}) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-premium-black fixed inset-0">
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
            <img src="https://flagcdn.com/w80/br.png" alt="BR" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <img src="https://flagcdn.com/w80/es.png" alt="ES" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
        <div className="relative" style={{ perspective: '1000px' }}>
          <RotatingArcs size="md" />
          <img 
            src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
            alt="Logo" 
            className="w-64 h-64 md:w-72 md:h-72 relative z-10 mix-blend-screen drop-shadow-[0_0_30px_rgba(204,0,0,0.6)] object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/capoeira-logo/400/400";
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-2 mt-8">
          <MainTitle />
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 px-8 mb-12">

        <InkButton 
          t={t} 
          onClick={() => { setAuthRole('member'); setAuthMode('login'); setView('auth'); }} 
          className="w-full"
          jaguar={true}
          small={true}
          shine={true}
        >
          {t('MEMBROS', 'MIEMBROS')}
        </InkButton>
        
        <InkButton 
          t={t} 
          onClick={() => { setAuthRole('admin'); setAuthMode('login'); setView('auth'); }} 
          className="w-full distressed-red !bg-zinc-800"
          jaguar={true}
          small={true}
          shine={true}
        >
          {t('PAINEL ADM', 'PANEL ADM')}
        </InkButton>
      </div>

      <Footer t={t} />
    </motion.div>
  </div>
);

const AuthView = ({ t, setView, authRole, authMode, setAuthMode, handleAuth, appConfig }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  authRole: 'member' | 'admin'; 
  authMode: 'login' | 'register'; 
  setAuthMode: (mode: 'login' | 'register') => void; 
  handleAuth: (email: string, nickname: string, password: string, photoURL?: string) => Promise<string | null>; 
  appConfig: AppConfig | null;
}) => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setAuthError('');
    
    // Validation
    if (authMode === 'register' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setAuthError(t('Por favor, insira um email válido', 'Por favor, ingrese un correo electrónico válido'));
        return;
      }
    }

    if (!nickname.trim()) {
      setAuthError(t('O apelido é obrigatório', 'El apodo es obligatorio'));
      return;
    }
    
    if (password.length < 6) {
      setAuthError(t('A senha deve ter pelo menos 6 caracteres', 'La contraseña deve tener al menos 6 caracteres'));
      return;
    }

    setIsSubmitting(true);
    const error = await handleAuth(email, nickname, password);
    if (error) {
      setAuthError(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-premium-black">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
      
      <button onClick={() => setView('login')} className="absolute top-6 left-6 p-2 text-incendeia-orange z-20">
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative" style={{ perspective: '500px' }}>
            <RotatingArcs size="sm" />
            <LazyImage 
              src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
              alt="Logo Oficial" 
              className="w-36 h-36 relative z-10"
              imgClassName="mix-blend-screen drop-shadow-[0_0_15px_rgba(204,0,0,0.4)]"
              objectFit="contain"
            />
          </div>
          <div className="flex flex-col items-center gap-1 mt-8">
            <MainTitle size="sm" />
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

        <div className="flex flex-col gap-4 md:gap-6 bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
          {authMode === 'register' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('EMAIL', 'EMAIL')}</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`bg-black/50 border ${authError && !email.trim() ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 md:p-4 text-white focus:border-incendeia-red outline-none transition-all`} 
                placeholder={t('Seu email (opcional)...', 'Tu email (opcional)...')}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('APELIDO', 'APODO')}</label>
            <input 
              type="text" 
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className={`bg-black/50 border ${authError && !nickname.trim() ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 md:p-4 text-white focus:border-incendeia-red outline-none transition-all`} 
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
              className={`bg-black/50 border ${authError && password.length < 6 ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 md:p-4 text-white focus:border-incendeia-red outline-none transition-all`} 
              placeholder="******"
            />
          </div>

          {authError && <p className="text-red-500 text-xs text-center font-bold uppercase">{authError}</p>}

          <InkButton t={t} onClick={onSubmit} className="w-full mt-2" jaguar={true} small={true} shine={true}>
            <span className="text-xs">{isSubmitting ? t('CARREGANDO...', 'CARGANDO...') : (authMode === 'login' ? t('ENTRAR', 'ENTRAR') : t('SALVAR', 'GUARDAR'))}</span>
          </InkButton>
        </div>
        <Footer t={t} />
      </div>
    </div>
  );
};

const HomeView = ({ t, setView, profile, hasNewMessages, isAdmin, appConfig }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  profile: UserProfile | null; 
  hasNewMessages: boolean; 
  isAdmin: boolean;
  appConfig: AppConfig | null;
}) => {
  const { eventNotices } = useAuth();
  
  const menuItems = [
    { title: t('MEU PERFIL', 'MI PERFIL'), icon: User, onClick: () => setView('profile') },
    { title: t('GALERIA', 'GALERIA'), icon: ImageIcon, onClick: () => setView('gallery') },
    { title: t('MESTRES', 'MAESTROS'), icon: Users, onClick: () => setView('masters') },
    { title: t('CHAT', 'CHAT'), icon: MessageSquare, onClick: () => setView('chat'), hasNotification: hasNewMessages },
    { title: t('GRADUAÇÕES', 'GRADUACIONES'), icon: Award, onClick: () => setView('graduations') },
    { title: t('FILIAIS', 'FILIALES'), icon: MapPin, onClick: () => setView('branches') },
    { title: t('LOCAIS', 'LUGARES'), icon: MapPin, onClick: () => setView('calendar') },
    { title: t('LOJA', 'TIENDA'), icon: ShoppingBag, onClick: () => setView('store') },
    { title: t('IA ASSISTENTE', 'IA ASISTENTE'), icon: Sparkles, onClick: () => setView('ai-chat') },
  ];

  if (isAdmin) {
    menuItems.push({ title: t('PAINEL ADM', 'PANEL ADM'), icon: Settings, onClick: () => setView('admin-panel') });
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background Glow 3D */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '1000px' }}>
        <motion.div 
          animate={{ 
            rotateX: [0, 20, 0, -20, 0], 
            rotateY: [0, 30, 0, -30, 0],
            z: [0, 50, 0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="w-[150%] h-[150%] bg-gradient-to-br from-incendeia-red/30 via-incendeia-red/10 to-transparent rounded-full blur-[100px]"
        />
      </div>

      {/* Notice Board */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm mb-8 z-20"
      >
        <div className="bg-zinc-900/80 backdrop-blur-md rounded-3xl border border-white/10 p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-incendeia-red" />
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-incendeia-red/20 rounded-lg">
                <Bell className="w-4 h-4 text-incendeia-red" />
              </div>
              <h3 className="text-[11px] font-black-ops text-white uppercase tracking-widest">{t('MURAL DE AVISOS E ATUALIZAÇÕES', 'AVISOS Y ACTUALIZACIONES')}</h3>
            </div>
            {eventNotices.length > 0 && (
              <span className="text-[8px] font-bold text-incendeia-red animate-pulse uppercase tracking-tighter">● {t('AO VIVO', 'EN VIVO')}</span>
            )}
          </div>
          
          <div className="space-y-3 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
            {/* Updates Section */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 opacity-60">
               <TrendingUp className="w-3 h-3 text-incendeia-orange" />
               <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{t('ÚLTIMAS ATUALIZAÇÕES DO APP', 'ÚLTIMAS ACTUALIZACIONES')}</span>
            </div>
            
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 mb-3">
              <p className="text-[9px] text-white font-bold mb-1 uppercase tracking-tighter">VERSÃO 2.0.4 - FIRE UPDATE 🔥</p>
              <p className="text-[8px] text-zinc-400">{t('Novas animações de capoeira, logo com rotação fluida e painel de diagnóstico.', 'Nuevas animaciones de capoeira, logo con rotación fluida y panel de diagnóstico.')}</p>
            </div>

            {eventNotices.length === 0 ? (
              <p className="text-[9px] text-zinc-500 italic py-2">{t('Nenhum aviso no momento...', 'No hay avisos por ahora...')}</p>
            ) : (
              eventNotices.map((notice) => (
                <motion.div 
                  key={notice.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`p-3 rounded-2xl border ${notice.importance === 'urgent' ? 'bg-red-500/10 border-red-500/30' : notice.importance === 'high' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-bold text-white uppercase">{notice.title}</span>
                    <span className="text-[7px] font-bold text-zinc-500">
                      {notice.date instanceof Date ? notice.date.toLocaleDateString() : notice.date?.toDate?.().toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[8px] text-zinc-400 leading-relaxed">{notice.description}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center shrink-0">
        {/* Central Logo */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center"
        >
          <RotatingArcs size="md" />
          <LazyImage 
            src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
            alt="Logo Oficial" 
            className="w-full h-full"
            imgClassName="mix-blend-screen drop-shadow-[0_0_20px_rgba(204,0,0,0.5)]"
            objectFit="contain"
          />
        </motion.div>
        <div className="absolute top-[80%] z-20">
        </div>

        {/* Rotating Menu Container */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full flex items-center justify-center pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          {menuItems.map((item, index) => {
            const angle = (index * (360 / menuItems.length)) - 90;
            const radius = 140;
            
            return (
              <div
                key={index}
                className="absolute pointer-events-auto"
                style={{
                  transform: `rotate(${angle}deg) translate(${radius}px)`,
                  willChange: 'transform'
                }}
              >
                {/* Counter-rotate the item to keep it upright */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                  style={{ willChange: 'transform' }}
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

const ProfileView = ({ t, setView, profile, logout, showConfirm, isAdmin }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  profile: UserProfile | null; 
  logout: () => void; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  isAdmin: boolean;
}) => {
  const { trainingLogs, addTrainingLog, userGallery, uploadToGallery, deleteGalleryItem, user, uploadProfilePhoto, updateProfile, uploadProgress } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<{file: File, url: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview({ file, url });
    // Reset file input so same file can be selected again if canceled
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const confirmAvatarUpload = async () => {
    if (!avatarPreview) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadProfilePhoto(avatarPreview.file);
      await updateProfile({ photoURL: url });
      setAvatarPreview(null);
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
            {/* Intertwined Arcs Effect */}
            <RotatingArcs size="sm" color1={graduationColor} color2={graduationColor} />
            {/* Fire Circle Effect */}
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
              className="absolute inset-0 rounded-full blur-xl opacity-40"
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

            <div 
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
              className="w-28 h-28 rounded-full border-4 border-premium-black p-1 relative z-10 overflow-hidden bg-zinc-800 shadow-2xl cursor-pointer group"
            >
              <LazyImage 
                src={profile?.photoURL || "https://picsum.photos/seed/capoeira-user/200/200"} 
                alt={profile?.nickname || 'Profile'} 
                className={`w-full h-full rounded-full object-cover transition-opacity ${isUploadingAvatar ? 'opacity-50' : 'group-hover:opacity-70'}`} 
              />
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover:opacity-100 bg-black/30'}`}>
                {isUploadingAvatar ? (
                   <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                   <Banana className="w-8 h-8 text-white drop-shadow-lg" />
                )}
              </div>
              <input 
                ref={avatarInputRef}
                type="file" 
                onChange={handleAvatarSelect} 
                className="hidden" 
                accept="image/*,.heic,.heif,.webp"
                disabled={isUploadingAvatar}
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

      {/* Avatar Preview Modal */}
      <AnimatePresence>
        {avatarPreview && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => !isUploadingAvatar && setAvatarPreview(null)} 
              className="fixed inset-0 bg-black/90 z-[300] backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-zinc-900 z-[310] rounded-[32px] border border-white/10 p-6 shadow-2xl flex flex-col items-center gap-6"
            >
              <h3 className="text-lg font-black-ops text-white uppercase tracking-widest">{t('CONFIRMAR NOVA FOTO', 'CONFIRMAR NUEVA FOTO')}</h3>
              
              <div className="w-40 h-40 rounded-full border-4 border-incendeia-orange overflow-hidden relative shadow-[0_0_20px_rgba(255,102,0,0.4)]">
                <img src={avatarPreview.url} className="w-full h-full object-cover" alt="Preview" />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-white text-xs font-bold">{Math.round(uploadProgress)}%</span>
                  </div>
                )}
              </div>

              <div className="flex w-full gap-3">
                <Button 
                  variant="danger" 
                  className="flex-1" 
                  onClick={() => setAvatarPreview(null)}
                  disabled={isUploadingAvatar}
                >
                  {t('CANCELAR', 'CANCELAR')}
                </Button>
                <Button 
                  className="flex-1 flex gap-2 items-center justify-center" 
                  onClick={confirmAvatarUpload}
                  disabled={isUploadingAvatar}
                >
                  <Upload className="w-4 h-4" />
                  {t('ENVIAR', 'ENVIAR')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="p-6 -mt-6 relative z-20">
        {/* Check-in Section */}
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-incendeia-red/20 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-incendeia-orange" />
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
            <TrendingUp className="w-6 h-6 text-incendeia-orange mb-2" />
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
              <Calendar className="w-5 h-5 text-incendeia-orange" />
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
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, index) => (
              <span key={index} className="text-[8px] font-bold text-zinc-600 mb-2">{d}</span>
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
            <label 
              className={`bg-incendeia-orange/20 p-2 rounded-lg hover:bg-incendeia-orange/30 transition-colors cursor-pointer flex items-center justify-center relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              title="Nano Banana Upload"
            >
              {isUploading ? <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" /> : <div className="flex items-center gap-1"><Banana className="w-4 h-4 text-incendeia-orange" /><Plus className="w-3 h-3 text-incendeia-orange" /></div>}
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,video/*,.heic,.heif,.webp" disabled={isUploading} />
            </label>
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
          {isAdmin && (
            <InkButton t={t} onClick={() => setView('admin-panel')} className="w-full bg-zinc-800 border-incendeia-red/30">
              <Settings className="w-5 h-5 mr-2" />
              {t('PAINEL ADMINISTRATIVO', 'PANEL ADMINISTRATIVO')}
            </InkButton>
          )}
          <InkButton t={t} onClick={() => setView('edit-profile')} className="w-full">{t('EDITAR PERFIL', 'EDITAR PERFIL')}</InkButton>
          <button onClick={logout} className="w-full py-4 text-zinc-500 font-bold uppercase text-xs hover:text-red-500 transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            {t('SAIR DA CONTA', 'CERRAR SESIÓN')}
          </button>

          {isAdmin && (
            <button 
              onClick={() => { setView('test-db' as View); }} 
              className="w-full py-3 border border-zinc-800 text-zinc-500 font-bold uppercase text-[10px] hover:bg-zinc-800 transition-colors rounded-xl mt-4"
            >
              {t('DIAGNÓSTICO DO SISTEMA', 'DIAGNÓSTICO DEL SISTEMA')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EditProfileView = ({ t, initialData, handleSaveProfile, setView, showAlert }: { 
  t: (pt: string, es: string) => string; 
  initialData: UserProfile; 
  handleSaveProfile: (data: UserProfile) => Promise<void>; 
  setView: (view: View) => void; 
  showAlert: (message: string) => void;
}) => {
  const { uploadProfilePhoto, uploadProgress, updateProfile } = useAuth();
  const [editData, setEditData] = useState(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAutoSave = async (field: keyof UserProfile, value: unknown) => {
    try {
      await updateProfile({ [field]: value });
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  };

  const handleChange = (field: keyof UserProfile, value: unknown) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(field, value);
    }, 1000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadProfilePhoto(file);
      setEditData({ ...editData, photoURL: url });
      await updateProfile({ photoURL: url });
      showAlert(t('Foto carregada e salva com sucesso!', '¡Foto cargada y guardada con éxito!'));
    } catch (error) {
      console.error("Error uploading photo:", error);
      showAlert(t('Erro ao carregar foto.', 'Error al cargar la foto.'));
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
            <LazyImage src={editData.photoURL || "https://picsum.photos/seed/capoeira-user/200/200"} alt="Profile" className="w-full h-full rounded-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <div className="w-8 h-8 border-4 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
                {uploadProgress > 0 && (
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                    />
                  </div>
                )}
                <span className="text-white text-xs font-bold mt-2">{Math.round(uploadProgress)}%</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-4 w-full">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center bg-incendeia-red text-white font-black-ops uppercase tracking-[0.2em] rounded-2xl hover:bg-red-700 transition-all cursor-pointer text-sm px-8 py-5 shadow-[0_10px_20px_rgba(204,0,0,0.3)] group relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Banana className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              {t('ALTERAR FOTO (NANO BANANA)', 'CAMBIAR FOTO (NANO BANANA)')}
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.heic,.heif,.webp"
                disabled={isUploading}
              />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('Escolha uma foto da sua galeria ou tire uma nova', 'Elija uma foto de su galería o tome una nueva')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('APELIDO', 'APODO')}</label>
          <input 
            type="text" 
            value={editData.nickname}
            onChange={e => handleChange('nickname', e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('GRADUAÇÃO', 'GRADUACIÓN')}</label>
          <select 
            value={editData.graduation}
            onChange={e => handleChange('graduation', e.target.value)}
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
            onChange={e => handleChange('birthDate', e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('IDADE', 'EDAD')}</label>
          <input 
            type="number" 
            value={editData.age}
            onChange={e => handleChange('age', parseInt(e.target.value) || 0)}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('TEMPO DE CAPOEIRA', 'TIEMPO DE CAPOEIRA')}</label>
          <input 
            type="text" 
            value={editData.capoeiraTime}
            onChange={e => handleChange('capoeiraTime', e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
          <textarea 
            value={editData.bio}
            onChange={e => handleChange('bio', e.target.value)}
            placeholder={t('Conte um pouco sobre você...', 'Cuéntanos un poco sobre ti...')}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red min-h-[100px] resize-none" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('FEEDBACK', 'FEEDBACK')}</label>
          <textarea 
            value={editData.feedback}
            onChange={e => handleChange('feedback', e.target.value)}
            placeholder={t('Deixe seu feedback para o mestre...', 'Deja tu feedback para el mestre...')}
            className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-incendeia-red min-h-[100px] resize-none" 
          />
        </div>
        <div className="flex gap-4 mt-4">
          <Button variant="danger" className="flex-1" onClick={() => setView('profile')}>{t('VOLTAR', 'VOLVER')}</Button>
        </div>

        {/* Floating Save Button */}
        <motion.button
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSaveProfile(editData)}
          className="fixed bottom-10 right-6 bg-incendeia-red text-white px-8 py-4 rounded-2xl shadow-[0_10px_25px_rgba(204,0,0,0.5)] flex items-center gap-3 z-[100] font-black-ops uppercase tracking-[0.2em] border border-white/20"
        >
          <Save className="w-6 h-6" />
          <span className="text-sm font-bold">{t('SALVAR', 'GUARDAR')}</span>
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_2s_infinite] pointer-events-none" />
        </motion.button>
      </div>
    </div>
  );
};

const GallerySkeleton = () => (
  <div className="grid grid-cols-2 gap-4 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="aspect-square rounded-2xl bg-zinc-800/50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-zinc-700/50" />
      </div>
    ))}
  </div>
);

const GalleryView = ({ t, setView, isAdmin, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  setView: (view: View) => void; 
  isAdmin: boolean; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { galleryItems, uploadToGallery, loadMoreGallery, hasMoreGallery, likeGalleryItem, reactToGalleryItem, commentOnGalleryItem, getGalleryComments, user, deleteGalleryItem, uploadProgress, profile } = useAuth();
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
  const [pendingUrl, setPendingUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingUrl('');
    setShowUploadModal(true);
  };

  const handleUrlSelect = () => {
    if (!pendingUrl) return;
    setPendingFile(null);
    setShowUploadModal(true);
  };

  const handleAIAnalyze = async () => {
    if (!pendingFile || pendingFile.type.startsWith('video/')) return;
    setIsAnalyzing(true);
    try {
      // We need a temporary URL to analyze the image
      const tempUrl = URL.createObjectURL(pendingFile);
      const description = await analyzeGalleryContent(tempUrl);
      setUploadDescription(description);
      URL.revokeObjectURL(tempUrl);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    if (!pendingFile && !pendingUrl) return;
    setIsUploading(true);
    try {
      await uploadToGallery(pendingFile || pendingUrl, uploadDescription);
      setShowUploadModal(false);
      setUploadDescription('');
      setPendingFile(null);
      setPendingUrl('');
      showAlert(t('Postagem realizada com sucesso! (Nano Banana)', '¡Publicación realizada con éxito! (Nano Banana)'));
    } catch (error) {
      console.error("Upload failed:", error);
      showAlert(t('Erro ao enviar arquivo. Verifique sua conexão.', 'Error al enviar archivo. Verifique su conexión.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredItems = galleryItems.filter(item => item.type === activeTab);

  return (
    <div className="p-6 pb-24">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('GALERIA', 'GALERIA')}</h2>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t('Fotos e Vídeos do Grupo', 'Fotos y Videos del Grupo')}</p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`bg-incendeia-red px-6 py-4 rounded-2xl shadow-[0_10px_20px_rgba(204,0,0,0.3)] active:scale-95 transition-all flex items-center gap-3 group relative overflow-hidden ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Banana className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-xs font-black-ops text-white uppercase tracking-[0.15em] font-bold">{t('NANO BANANA UPLOAD', 'NANO BANANA UPLOAD')}</span>
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileSelect} 
                className="hidden" 
                disabled={isUploading}
              />
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            value={pendingUrl}
            onChange={e => setPendingUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSelect()}
            placeholder={t('Colar URL da imagem (Qualquer fonte)...', 'Pegar URL de imagen (Cualquier fuente)...')}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-incendeia-red"
          />
          <button 
            onClick={handleUrlSelect}
            className="bg-zinc-800 p-3 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload Progress Bar (Global) */}
      {isUploading && uploadProgress > 0 && (
        <div className="mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-incendeia-orange shadow-[0_0_15px_rgba(255,102,0,0.3)] overflow-hidden relative">
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t('ENVIANDO MÍDIA...', 'ENVIANDO MEDIA...')}</span>
            <span className="text-[10px] font-bold text-incendeia-orange">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'image' ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('FOTOS', 'FOTOS')}
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
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
          <div ref={observerTarget} className="mt-8">
            {isLoadingMore && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-center mb-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-incendeia-red border-t-transparent rounded-full shadow-[0_0_10px_rgba(204,0,0,0.5)]"
                  />
                </div>
                <GallerySkeleton />
                <p className="text-[10px] font-bold text-zinc-600 text-center uppercase tracking-widest animate-pulse">
                  {t('Buscando mais tesouros...', 'Buscando más tesoros...')}
                </p>
              </div>
            )}
            {!hasMoreGallery && filteredItems.length > 0 && (
              <p className="text-[10px] font-bold text-zinc-700 text-center uppercase tracking-[0.3em] py-8 opacity-40">
                {t('FIM DA JORNADA', 'FIN DE LA JORNADA')}
              </p>
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
              
              <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-black border border-white/5 flex items-center justify-center">
                {pendingFile ? (
                  pendingFile.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(pendingFile)} className="w-full h-full object-contain" controls />
                  ) : (
                    <img src={URL.createObjectURL(pendingFile)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  )
                ) : pendingUrl ? (
                  <img src={pendingUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).src = "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"; }} />
                ) : (
                  <Banana className="w-12 h-12 text-zinc-800" />
                )}
              </div>

              <div className="flex flex-col gap-2 mb-8">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DESCRIÇÃO', 'DESCRIPCIÓN')}</label>
                  {pendingFile?.type.startsWith('image/') && (
                    <button 
                      onClick={handleAIAnalyze}
                      disabled={isAnalyzing}
                      className="text-[10px] font-bold text-incendeia-red uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {isAnalyzing ? <div className="w-3 h-3 border border-incendeia-red border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {t('GERAR COM IA', 'GENERAR CON IA')}
                    </button>
                  )}
                </div>
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
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       {Math.round(uploadProgress)}%
                    </div>
                  ) : t('POSTAR', 'PUBLICAR')}
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
            user={profile}
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
  user: UserProfile | null; 
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
            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 mb-8 flex justify-between items-start gap-4">
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">{item.description}</p>
              <button 
                onClick={() => textToSpeech(item.description).then(url => url && new Audio(url).play())}
                className="p-2 bg-zinc-800 rounded-xl hover:bg-incendeia-red/20 transition-colors shrink-0"
              >
                <Volume2 className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          )}

          {/* Reactions Summary */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {item.reactions && Object.entries(item.reactions).map(([emoji, uids]: [string, string[]]) => (
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
  const { masters, isAdmin, addMaster, updateMaster, deleteMaster, uploadFile, uploadProgress } = useAuth();
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [newMaster, setNewMaster] = useState<Omit<Master, 'id'>>({ name: '', role: '', bio: '', photoURL: '', instagram: '', website: '' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'masters');
      setNewMaster(prev => ({ ...prev, photoURL: url }));
    } catch (error) {
      console.error("Error uploading master photo:", error);
    } finally {
      setIsUploading(false);
    }
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
                <div className="flex flex-col items-center gap-3 mb-2">
                  <label 
                    className={`w-32 h-32 rounded-full border-2 border-dashed ${newMaster.photoURL ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group bg-black/30 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {newMaster.photoURL ? (
                      <LazyImage src={newMaster.photoURL || undefined} alt={newMaster.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Banana className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{t('FOTO DO MESTRE', 'FOTO DEL MAESTRO')}</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
                        {uploadProgress > 0 && (
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                            />
                          </div>
                        )}
                        <span className="text-white text-[10px] font-bold mt-1">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff"
                      disabled={isUploading}
                    />
                  </label>
                </div>
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
                <LazyImage 
                  src={selectedMaster.photoURL || 'https://picsum.photos/seed/mestre/200/200'} 
                  alt={selectedMaster.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-incendeia-red mb-4 shadow-2xl shadow-incendeia-red/20" 
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
  const { events, addEvent, deleteEvent, user, isAdmin, uploadFile, uploadProgress } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    description: '',
    date: '' as any,
    location: '',
    type: 'training',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    
    await addEvent({
      ...newEvent,
      date: new Date(newEvent.date)
    });
    setIsAdding(false);
    setNewEvent({ title: '', description: '', date: '', location: '', type: 'training', imageUrl: '' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'events');
      setNewEvent(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Error uploading event image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'training': return <Award className="w-5 h-5 text-blue-400" />;
      case 'workshop': return <Users className="w-5 h-5 text-purple-400" />;
      case 'roda': return <Play className="w-5 h-5 text-incendeia-orange" />;
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
            <div key={event.id} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              {event.imageUrl && (
                <div className="w-full h-40 relative">
                  <LazyImage src={event.imageUrl} alt={event.title} className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>
              )}
              <div className="p-5 flex gap-5">
                <div className="flex flex-col items-center justify-center bg-zinc-800/50 rounded-2xl p-3 min-w-[60px] h-fit">
                  <span className="text-xs font-bold text-incendeia-red uppercase">{format(event.date.toDate(), 'MMM', { locale: ptBR })}</span>
                  <span className="text-2xl font-black-ops text-white">{format(event.date.toDate(), 'dd')}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getEventIcon(event.type)}
                    <h3 className="text-lg font-bold text-white leading-tight">{event.title}</h3>
                  </div>
                  <div className="flex flex-col gap-2 mb-3">
                    <p className="text-zinc-400 text-xs leading-relaxed">{event.description}</p>
                    <button 
                      onClick={() => textToSpeech(event.description).then(url => url && new Audio(url).play())}
                      className="flex items-center gap-1 text-[8px] font-bold text-zinc-600 uppercase tracking-widest hover:text-incendeia-red transition-colors w-fit"
                    >
                      <Volume2 className="w-3 h-3" />
                      {t('OUVIR DESCRIÇÃO', 'ESCUCHAR DESCRIPCIÓN')}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-incendeia-red transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </a>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {event.type}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteEvent(event.id)} className="text-zinc-600 hover:text-red-500 transition-colors h-fit">
                    <Trash className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 bg-zinc-900 z-[110] rounded-t-[40px] p-8 border-t border-incendeia-red/20 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-black-ops text-white mb-6 uppercase tracking-widest">{t('NOVO EVENTO', 'NUEVO EVENTO')}</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 mb-2">
                  <label 
                    className={`w-full h-40 rounded-2xl border-2 border-dashed ${newEvent.imageUrl ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group bg-black/30 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {newEvent.imageUrl ? (
                      <LazyImage src={newEvent.imageUrl || undefined} alt={newEvent.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Banana className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{t('FOTO DO EVENTO', 'FOTO DEL EVENTO')}</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
                        {uploadProgress > 0 && (
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                            />
                          </div>
                        )}
                        <span className="text-white text-[10px] font-bold mt-1">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff"
                      disabled={isUploading}
                    />
                  </label>
                </div>
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
  const { storeItems, isAdmin, addStoreItem, updateStoreItem, deleteStoreItem, uploadFile, uploadProgress } = useAuth();
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
      const url = await uploadFile(file, 'store');
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
                  <label 
                    className={`w-32 h-32 rounded-2xl border-2 border-dashed ${newItem.imageUrl ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group bg-black/30 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {newItem.imageUrl ? (
                      <LazyImage src={newItem.imageUrl || undefined} alt={newItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Banana className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{t('FOTO DO ITEM', 'FOTO DEL ARTÍCULO')}</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
                        {uploadProgress > 0 && (
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                            />
                          </div>
                        )}
                        <span className="text-white text-[10px] font-bold mt-1">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff"
                      disabled={isUploading}
                    />
                  </label>
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
                  <LazyImage 
                    src={selectedItem.imageUrl || null} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover"
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
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('DASHBOARD', 'DASHBOARD')}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t('PAGAMENTOS', 'PAGOS')}
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
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
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$${v}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                            <p className="text-sm font-black-ops text-incendeia-red">
                              R$ {payload[0].value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    animationBegin={200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChartIcon className="w-3 h-3" />
              {t('STATUS DOS PAGAMENTOS', 'ESTADO DE LOS PAGOS')}
            </h3>
            <div className="h-64 w-full flex flex-col items-center">
              <div className="relative w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      animationBegin={500}
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{payload[0].name}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                                <p className="text-sm font-bold text-white">
                                  {payload[0].value} {payload[0].value === 1 ? t('PAGAMENTO', 'PAGO') : t('PAGAMENTOS', 'PAGOS')}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">TOTAL</p>
                  <p className="text-xl font-black-ops text-white leading-tight">
                    {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 px-4">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 group cursor-default">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125" style={{ backgroundColor: s.color }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200 transition-colors">
                        {s.name}
                      </span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase">
                        {Math.round((s.value / statusData.reduce((acc, curr) => acc + curr.value, 1)) * 100)}%
                      </span>
                    </div>
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
                      <Calendar className="w-5 h-5 text-incendeia-orange" />
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

const CordIcon = ({ colors, size = "md", animated = true }: { colors: string[], size?: "sm" | "md" | "lg", animated?: boolean }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <motion.div 
        animate={animated ? { 
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 0.95, 1]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-full h-full relative"
      >
        {/* Simple 3D Cord Representation using SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="cordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
            </linearGradient>
          </defs>
          
          {/* Twisted Rope Effect */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.path
              key={i}
              d={`M 20,${40 + i * 10} Q 50,${20 + i * 10} 80,${40 + i * 10} T 20,${60 + i * 10}`}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="12"
              strokeLinecap="round"
              className="opacity-90"
              animate={animated ? {
                strokeDashoffset: [0, 100],
              } : {}}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          ))}
          
          {/* Overlay for 3D depth */}
          <path
            d="M 20,40 Q 50,20 80,40 T 20,60 T 80,80"
            fill="none"
            stroke="url(#cordGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            className="mix-blend-overlay"
          />
        </svg>
      </motion.div>
    </div>
  );
};

const GraduationsView = ({ t }: { t: (pt: string, es: string) => string }) => {
  const graduations: Graduation[] = [
    { id: '1', name: 'Crua', colors: ['#f5f5dc'], level: 'aluno', meaning: 'Início da jornada', description: 'Representa a pureza e o potencial do aluno que está começando.' },
    { id: '2', name: 'Crua e Amarelo', colors: ['#f5f5dc', '#fbbf24'], level: 'aluno', meaning: 'Transição', description: 'O aluno começa a absorver os primeiros fundamentos.' },
    { id: '3', name: 'Amarelo', colors: ['#fbbf24'], level: 'aluno', meaning: 'Ouro', description: 'Representa a riqueza do aprendizado inicial.' },
    { id: '4', name: 'Amarelo e Laranja', colors: ['#fbbf24', '#f97316'], level: 'aluno', meaning: 'Crescimento', description: 'Evolução técnica e rítmica.' },
    { id: '5', name: 'Laranja', colors: ['#f97316'], level: 'aluno', meaning: 'Sol', description: 'O despertar da consciência na capoeira.' },
    { id: '6', name: 'Laranja e Azul', colors: ['#f97316', '#3b82f6'], level: 'aluno', meaning: 'Maturidade de Aluno', description: 'Preparação para o nível graduado.' },
    
    { id: '7', name: 'Azul', colors: ['#3b82f6'], level: 'graduado', meaning: 'Oceano', description: 'Imensidão do conhecimento adquirido.' },
    { id: '8', name: 'Azul e Verde', colors: ['#3b82f6', '#22c55e'], level: 'graduado', meaning: 'Floresta e Mar', description: 'Equilíbrio entre técnica e natureza.' },
    { id: '9', name: 'Verde', colors: ['#22c55e'], level: 'graduado', meaning: 'Esperança', description: 'Continuidade e vigor no grupo.' },
    { id: '10', name: 'Verde e Roxa', colors: ['#22c55e', '#a855f7'], level: 'graduado', meaning: 'Reflexão', description: 'Transição para o ensino.' },
    
    { id: '11', name: 'Roxa', colors: ['#a855f7'], level: 'instrutor', meaning: 'Ametista', description: 'Espiritualidade e dedicação ao ensino.' },
    { id: '12', name: 'Roxa e Marrom', colors: ['#a855f7', '#78350f'], level: 'instrutor', meaning: 'Transição Técnica', description: 'Aprofundamento nos fundamentos.' },
    
    { id: '13', name: 'Marrom', colors: ['#78350f'], level: 'professor', meaning: 'Terra', description: 'Solidez, base forte e liderança.' },
    
    { id: '14', name: 'Marrom e Vermelha', colors: ['#78350f', '#ef4444'], level: 'mestrando', meaning: 'Fogo e Terra', description: 'A chama da sabedoria começando a arder.' },
    
    { id: '15', name: 'Vermelha', colors: ['#ef4444'], level: 'mestre', meaning: 'Rubi', description: 'O ápice da sabedoria, o sangue que corre no grupo.' },
  ];

  const levels = ['aluno', 'graduado', 'instrutor', 'professor', 'mestrando', 'mestre'];

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-incendeia-red/20 p-2 rounded-xl">
          <Award className="w-6 h-6 text-incendeia-orange" />
        </div>
        <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('GRADUAÇÕES', 'GRADUACIONES')}</h2>
      </div>

      <div className="flex flex-col gap-10">
        {levels.map(level => {
          const levelGrads = graduations.filter(g => g.level === level);
          if (levelGrads.length === 0) return null;

          return (
            <div key={level} className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] border-l-2 border-incendeia-red pl-3 ml-1">
                {level}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {levelGrads.map(g => (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-[24px] flex items-center gap-6"
                  >
                    <CordIcon colors={g.colors} size="md" />
                    <div className="flex-1">
                      <h4 className="text-white font-black-ops text-sm uppercase mb-1">{g.name}</h4>
                      <p className="text-incendeia-red text-[9px] font-bold uppercase tracking-widest mb-2">{g.meaning}</p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed italic">{g.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BranchesView = ({ t, showConfirm }: { t: (pt: string, es: string) => string, showConfirm: (title: string, message: string, onConfirm: () => void) => void }) => {
  const { branches, isAdmin, deleteBranch } = useAuth();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-incendeia-red/20 p-2 rounded-xl">
            <MapPin className="w-6 h-6 text-incendeia-orange" />
          </div>
          <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('FILIAIS', 'FILIALES')}</h2>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-incendeia-red p-2 rounded-xl text-white shadow-lg shadow-incendeia-red/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {branches.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-[32px] border border-dashed border-white/5">
            <MapPin className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{t('Nenhuma filial cadastrada', 'Ninguna filial registrada')}</p>
          </div>
        ) : (
          branches.map(b => (
            <motion.div 
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden shadow-2xl group"
            >
              <div className="h-48 relative">
                <LazyImage src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                {isAdmin && (
                  <button 
                    onClick={() => showConfirm(t('EXCLUIR FILIAL', 'ELIMINAR FILIAL'), t('Deseja excluir esta filial?', '¿Desea eliminar esta filial?'), () => deleteBranch(b.id))}
                    className="absolute top-4 right-4 bg-black/60 p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black-ops text-white uppercase mb-4">{b.name}</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <MapPin className="w-4 h-4 text-incendeia-red" />
                    <span className="text-xs">{b.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Calendar className="w-4 h-4 text-incendeia-red" />
                    <span className="text-xs">{b.trainingDays.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Clock className="w-4 h-4 text-incendeia-red" />
                    <span className="text-xs">{b.trainingHours}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Phone className="w-4 h-4 text-incendeia-red" />
                    <span className="text-xs">{b.contact}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <a 
                    href={b.mapUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-incendeia-red text-white text-center py-3 rounded-xl font-black-ops text-xs uppercase tracking-widest hover:bg-red-700 transition-colors"
                  >
                    {t('VER NO MAPA', 'VER EN MAPA')}
                  </a>
                  <a 
                    href={`tel:${b.contact}`}
                    className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Branch Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 z-[110] rounded-[32px] border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-black-ops text-white uppercase mb-6">{t('NOVA FILIAL', 'NUEVA FILIAL')}</h3>
              <BranchForm 
                onClose={() => setShowAdd(false)} 
                t={t}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const BranchForm = ({ onClose, t }: { onClose: () => void; t: (pt: string, es: string) => string }) => {
  const { addBranch, uploadFile, uploadProgress } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    mapUrl: '',
    contact: '',
    trainingDays: [] as string[],
    trainingHours: '',
    location: ''
  });

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'branches');
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Error uploading branch photo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert(t('Por favor, suba uma imagem', 'Por favor, suba una imagen'));
    await addBranch(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('NOME', 'NOMBRE')}</label>
        <input 
          type="text" required value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('IMAGEM', 'IMAGEN')}</label>
        <div className="relative group aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
          {formData.imageUrl ? (
            <LazyImage src={formData.imageUrl || undefined} alt={formData.name} className="w-full h-full object-cover" />
          ) : (
            <Banana className="w-8 h-8 text-zinc-700" />
          )}
          <input 
            type="file" accept="image/*,video/*" onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
              {uploadProgress > 0 && (
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                  />
                </div>
              )}
              <span className="text-white text-[10px] font-bold mt-1">{Math.round(uploadProgress)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('LOCALIZAÇÃO', 'UBICACIÓN')}</label>
        <input 
          type="text" required value={formData.location}
          onChange={e => setFormData({...formData, location: e.target.value})}
          className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
          placeholder="Ex: São Paulo, SP"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('URL DO MAPA', 'URL DEL MAPA')}</label>
        <input 
          type="text" required value={formData.mapUrl}
          onChange={e => setFormData({...formData, mapUrl: e.target.value})}
          className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
          placeholder="Google Maps URL"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('CONTATO', 'CONTACTO')}</label>
        <input 
          type="text" required value={formData.contact}
          onChange={e => setFormData({...formData, contact: e.target.value})}
          className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
          placeholder="+55..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('DIAS DE TREINO', 'DÍAS DE ENTRENAMIENTO')}</label>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button
              key={day} type="button"
              onClick={() => {
                const newDays = formData.trainingDays.includes(day)
                  ? formData.trainingDays.filter(d => d !== day)
                  : [...formData.trainingDays, day];
                setFormData({...formData, trainingDays: newDays});
              }}
              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.trainingDays.includes(day) ? 'bg-incendeia-red text-white' : 'bg-zinc-800 text-zinc-500'}`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('HORÁRIO', 'HORARIO')}</label>
        <input 
          type="text" required value={formData.trainingHours}
          onChange={e => setFormData({...formData, trainingHours: e.target.value})}
          className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
          placeholder="Ex: 19:00 - 21:00"
        />
      </div>

      <button 
        type="submit" disabled={isUploading}
        className="bg-incendeia-red text-white font-black-ops py-4 rounded-xl mt-4 uppercase tracking-widest shadow-lg shadow-incendeia-red/20 disabled:opacity-50"
      >
        {t('SALVAR FILIAL', 'GUARDAR FILIAL')}
      </button>
    </form>
  );
};

const NotificationsView = ({ setView, t }: { setView: (view: View) => void; t: (pt: string, es: string) => string }) => {
  const { notifications, markNotificationAsRead, user } = useAuth();

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('NOTIFICAÇÕES', 'NOTIFICACIONES')}</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t('Mural de Avisos e Eventos', 'Mural de Avisos y Eventos')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{t('Nenhuma notificação', 'Ninguna notificación')}</p>
          </div>
        ) : (
          notifications.map(n => {
            const isRead = n.readBy.includes(user?.uid || '');
            return (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.link) setView(n.link as View);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${isRead ? 'bg-zinc-900/30 border-white/5 opacity-60' : 'bg-zinc-900/80 border-incendeia-red/30 shadow-lg shadow-incendeia-red/5'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${isRead ? 'bg-zinc-800 text-zinc-500' : 'bg-incendeia-red/20 text-incendeia-red'}`}>
                    {n.type === 'event' ? <Calendar className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-xs font-bold uppercase ${isRead ? 'text-zinc-400' : 'text-white'}`}>{n.title}</h4>
                      {!isRead && <div className="w-2 h-2 bg-incendeia-red rounded-full animate-pulse" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{n.body}</p>
                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                      {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'dd/MM HH:mm') : 'Agora'}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

const AIChatView = ({ t }: { t: (pt: string, es: string) => string }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const systemInstruction = "Você é o Mestre Incendeia, um assistente virtual especializado em Capoeira. Você ajuda alunos com dúvidas sobre golpes, história, música e eventos. Você também pode ajudar a encontrar locais de treino usando o Google Maps. Responda de forma sábia, respeitosa e motivadora, como um mestre de capoeira.";
      const response = await aiChat([...messages, userMsg], systemInstruction);
      
      const modelMsg: AIChatMessage = {
        role: 'model',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("AI Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async (text: string, index: number) => {
    try {
      const url = await textToSpeech(text);
      if (url) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[index] = { ...newMsgs[index], audioUrl: url };
          return newMsgs;
        });
        const audio = new Audio(url);
        audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-incendeia-red/20 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-incendeia-orange" />
        </div>
        <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('MESTRE IA', 'MAESTRO IA')}</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-incendeia-red/20">
              <Sparkles className="w-10 h-10 text-incendeia-red animate-pulse" />
            </div>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">
              {t('SALVE, CAMARÁ!', '¡SALVE, CAMARÁ!')}
            </p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-tighter max-w-[200px]">
              {t('Eu sou o Mestre IA. Como posso ajudar na sua jornada hoje?', 'Soy el Maestro IA. ¿Cómo posso ayudar en tu jornada hoy?')}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm relative ${m.role === 'user' ? 'bg-incendeia-red text-white rounded-tr-none shadow-lg shadow-incendeia-red/20' : 'bg-zinc-800 text-zinc-300 rounded-tl-none border border-white/5'}`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{m.content}</Markdown>
              </div>
              
              {m.role === 'model' && (
                <div className="mt-3 flex items-center gap-2">
                  <button 
                    onClick={() => handleTTS(m.content, i)}
                    className="p-1.5 bg-zinc-900/50 rounded-lg hover:bg-incendeia-red/20 transition-colors group"
                  >
                    <Volume2 className="w-4 h-4 text-zinc-500 group-hover:text-incendeia-red" />
                  </button>
                  {m.audioUrl && (
                    <div className="h-1 w-12 bg-incendeia-red/20 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: [-48, 48] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-incendeia-red"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-incendeia-red rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-incendeia-red rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-incendeia-red rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('Pergunte ao Mestre...', 'Pregunta al Maestro...')}
          className="flex-1 bg-transparent p-3 text-sm text-white outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-incendeia-red p-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:grayscale"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};
const ChatView = ({ t, messages, sendMessage, deleteMessage, user, isAdmin, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  messages: ChatMessage[]; 
  sendMessage: (text?: string, imageUrl?: string) => Promise<void>; 
  deleteMessage: (id: string) => Promise<void>; 
  user: UserProfile | null; 
  isAdmin: boolean; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { reactToMessage, uploadFile, uploadProgress } = useAuth();
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
      const url = await uploadFile(file, `chats/images/${user?.uid}`);
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
        <label 
          className={`bg-zinc-800 p-3 rounded-xl active:scale-95 transition-transform border border-white/5 text-zinc-400 hover:text-white cursor-pointer flex items-center justify-center relative ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isUploading ? <div className="w-5 h-5 border-2 border-incendeia-red border-t-transparent rounded-full animate-spin" /> : <Banana className="w-5 h-5" />}
          <input 
            type="file"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*,video/*"
            disabled={isUploading}
          />
        </label>
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
      {isUploading && uploadProgress > 0 && (
        <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            className="h-full bg-incendeia-red"
          />
        </div>
      )}
    </div>
  );
};

const AdminPanelView = ({ t, showConfirm, showAlert }: { 
  t: (pt: string, es: string) => string; 
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; 
  showAlert: (message: string) => void; 
}) => {
  const { 
    allUsers, 
    updateOtherUserProfile, 
    deleteOtherUserProfile, 
    appConfig, 
    updateAppConfig, 
    isAdmin,
    uploadFile,
    uploadProgress,
    masters, addMaster, updateMaster, deleteMaster,
    storeItems, addStoreItem, updateStoreItem, deleteStoreItem,
    events, addEvent, updateEvent, deleteEvent,
    branches, addBranch, updateBranch, deleteBranch,
    feeConfigs, addFeeConfig, deleteFeeConfig,
    developerMode,
    setDeveloperMode,
    logs,
    addLog,
    galleryItems,
    deleteGalleryItem,
    uploadToGallery,
    eventNotices,
    addEventNotice,
    deleteEventNotice
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'config' | 'style' | 'ai'>('dashboard');
  const [contentSubTab, setContentSubTab] = useState<'masters' | 'store' | 'events' | 'branches' | 'gallery'>('masters');
  const [configSubTab, setConfigSubTab] = useState<'general' | 'banners' | 'social'>('general');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<{ type: 'logo' | 'banner' | 'master' | 'store' | 'event' | 'gallery', id?: string } | null>(null);

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadContext({ type });
    try {
      const url = await uploadFile(file, type);
      if (type === 'logo') {
        await updateAppConfig({ logoUrl: url });
      } else if (type === 'banner') {
        const newBanners = [...(appConfig?.banners || []), url];
        await updateAppConfig({ banners: newBanners });
      }
      showAlert(t('Arquivo enviado com sucesso!', '¡Archivo subido com éxito!'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Desconhecido';
      console.error("Error uploading file:", error);
      showAlert(t(`Erro ao enviar: ${errorMessage}`, `Error al subir: ${errorMessage}`));
    } finally {
      setIsUploading(false);
      setUploadContext(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadToGallery(file);
      showAlert(t('Mídia adicionada com sucesso!', '¡Medio añadido con éxito!'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Desconhecido';
      console.error("Error uploading to gallery:", error);
      showAlert(t(`Erro ao enviar: ${errorMessage}`, `Error al subir: ${errorMessage}`));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    showConfirm(
      t('ALTERAR CARGO', 'CAMBIAR CARGO'),
      t(`Alterar cargo para ${newRole}?`, `¿Cambiar rol a ${newRole}?`),
      () => updateOtherUserProfile(userId, { role: newRole as any })
    );
  };

  const handleUpdateConfig = async (data: Partial<AppConfig>) => {
    await updateAppConfig(data);
    showAlert(t('Configurações salvas!', '¡Configuraciones guardadas!'));
  };

  const handleAiAsk = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const { generateAppAdvice } = await import('./services/geminiService');
    const response = await generateAppAdvice(aiPrompt);
    setAiResponse(response);
    setIsAiLoading(false);
  };

  if (!isAdmin) return <div className="p-20 text-center text-zinc-500 uppercase font-black-ops">{t('ACESSO NEGADO', 'ACCESO DENEGADO')}</div>;

  return (
    <div className="p-6 pb-24">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black-ops text-incendeia-red uppercase">{t('PAINEL ADM', 'PANEL ADM')}</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t('Controle Total do Grupo', 'Control Total del Grupo')}</p>
        </div>
        <div className="bg-zinc-900 px-3 py-1 rounded-full border border-white/10">
          <span className="text-[8px] font-bold text-zinc-400 uppercase">v{appConfig?.version || 1}</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-900/50 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: t('RESUMO', 'RESUMEN') },
          { id: 'users', icon: Users, label: t('MEMBROS', 'MIEMBROS') },
          { id: 'content', icon: FileText, label: t('CONTEÚDO', 'CONTENIDO') },
          { id: 'config', icon: Settings, label: t('AJUSTES', 'AJUSTES') },
          { id: 'style', icon: Palette, label: t('ESTILO', 'ESTILO') },
          { id: 'ai', icon: Sparkles, label: t('IA', 'IA') }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex flex-col gap-1">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('TOTAL MEMBROS', 'TOTAL MIEMBROS')}</span>
                <span className="text-2xl font-black-ops text-white">{allUsers.length}</span>
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex flex-col gap-1">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('GALERIA', 'GALERIA')}</span>
                <span className="text-2xl font-black-ops text-incendeia-red">{galleryItems.length}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black-ops text-white uppercase tracking-widest">{t('NOVO AVISO', 'NUEVO AVISO')}</h3>
                <Bell className="w-4 h-4 text-incendeia-red" />
              </div>
              <div className="space-y-4">
                <input 
                  type="text" 
                  id="dash-notice-title"
                  placeholder={t('Título do aviso...', 'Título del aviso...')}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-[11px] text-white outline-none focus:border-incendeia-red"
                />
                <textarea 
                  id="dash-notice-desc"
                  placeholder={t('Escreva o conteúdo...', 'Escriba el contenido...')}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-[11px] text-zinc-400 outline-none focus:border-incendeia-red h-24 resize-none"
                />
                <div className="flex gap-3">
                  <select id="dash-notice-imp" className="bg-zinc-800 border-none rounded-xl text-[10px] font-bold text-white p-3 flex-1 uppercase tracking-tighter">
                    <option value="normal">NORMAL</option>
                    <option value="high">URGENTE</option>
                  </select>
                  <button 
                    onClick={async () => {
                      const title = (document.getElementById('dash-notice-title') as HTMLInputElement).value;
                      const description = (document.getElementById('dash-notice-desc') as HTMLTextAreaElement).value;
                      const importance = (document.getElementById('dash-notice-imp') as HTMLSelectElement).value as any;
                      if (!title || !description) return;
                      await addEventNotice({ title, description, importance, date: new Date() });
                      (document.getElementById('dash-notice-title') as HTMLInputElement).value = '';
                      (document.getElementById('dash-notice-desc') as HTMLTextAreaElement).value = '';
                      showAlert(t('Aviso publicado no mural!', '¡Aviso publicado en el mural!'));
                    }}
                    className="bg-incendeia-red text-white px-8 rounded-xl text-[10px] font-black-ops uppercase tracking-widest"
                  >
                    {t('PUBLICAR', 'PUBLICAR')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black-ops text-zinc-500 uppercase tracking-widest px-2">{t('AVISOS ATIVOS', 'AVISOS ACTIVOS')}</h3>
              {eventNotices.map(notice => (
                <div key={notice.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${notice.importance === 'urgent' ? 'bg-red-500' : 'bg-incendeia-red'}`} />
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase">{notice.title}</p>
                      <p className="text-[8px] text-zinc-500">{notice.date instanceof Date ? notice.date.toLocaleDateString() : notice.date?.toDate?.().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteEventNotice(notice.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black-ops text-white uppercase tracking-widest">{t('GESTÃO DE MEMBROS', 'GESTIÓN DE MIEMBROS')}</h3>
              <span className="text-[10px] font-bold text-zinc-500">{allUsers.length} {t('USUÁRIOS', 'USUARIOS')}</span>
            </div>
            {allUsers.map((u: UserProfile) => (
              <div key={u.uid} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LazyImage src={u.photoURL || "https://picsum.photos/seed/user/100/100"} alt={u.nickname} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-white">{u.nickname || u.displayName || 'Sem Nome'}</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir este usuário?', '¿Eliminar este usuario?'), () => deleteOtherUserProfile(u.uid))}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">{t('CARGO', 'CARGO')}</label>
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white uppercase outline-none focus:border-incendeia-red"
                    >
                      <option value="member">{t('MEMBRO', 'MIEMBRO')}</option>
                      <option value="admin">{t('ADMIN', 'ADMIN')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">{t('GRADUAÇÃO', 'GRADUACIÓN')}</label>
                    <select 
                      value={u.graduation}
                      onChange={(e) => updateOtherUserProfile(u.uid, { graduation: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white uppercase outline-none focus:border-incendeia-red"
                    >
                      {GRADUATIONS.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div 
            key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Sub Tabs */}
            <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
              {[
                { id: 'masters', icon: Award, label: t('MESTRES', 'MAESTROS') },
                { id: 'store', icon: ShoppingBag, label: t('LOJA', 'TIENDA') },
                { id: 'events', icon: Calendar, label: t('AGENDA', 'AGENDA') },
                { id: 'branches', icon: MapPin, label: t('FILIAIS', 'FILIALES') },
                { id: 'gallery', icon: ImageIcon, label: t('GALERIA', 'GALERIA') }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setContentSubTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${contentSubTab === tab.id ? 'bg-incendeia-red text-white shadow-[0_0_10px_rgba(204,0,0,0.5)]' : 'text-zinc-500'}`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {contentSubTab === 'gallery' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label 
                    className={`w-full py-12 border-2 border-dashed border-white/10 rounded-3xl text-sm font-black-ops text-zinc-500 uppercase tracking-[0.2em] hover:border-incendeia-red hover:text-incendeia-red transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative bg-zinc-900/40 group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isUploading && uploadContext?.type === 'gallery' ? (
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-10 h-10 border-4 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                         <span className="text-incendeia-orange font-bold text-xs">{Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform">
                          <Plus className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span>{t('ADICIONAR MÍDIA LOCAL', 'AÑADIR MEDIA LOCAL')}</span>
                          <span className="text-[9px] text-zinc-600 lowercase tracking-normal font-sans italic">{t('(fotos ou vídeos)', '(fotos o videos)')}</span>
                        </div>
                      </>
                    )}
                    <input type="file" onChange={handleGalleryUpload} className="hidden" accept="image/*,video/*" disabled={isUploading} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {galleryItems.map(item => (
                    <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5">
                      {item.type === 'video' ? (
                        <LazyVideo src={item.url} className="w-full h-full" />
                      ) : (
                        <LazyImage src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir esta mídia?', '¿Eliminar este medio?'), () => deleteGalleryItem(item.id, item.authorUid))}
                          className="p-2 bg-red-500 text-white rounded-lg"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentSubTab === 'masters' && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => addMaster({ name: 'Novo Mestre', role: 'Mestre', bio: '', photoURL: 'https://picsum.photos/seed/master/200/200' })}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-incendeia-red hover:text-incendeia-red transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('ADICIONAR MESTRE', 'AÑADIR MAESTRO')}
                </button>
                {masters.map(m => (
                  <div key={m.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                          <LazyImage src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <label 
                          className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer rounded-xl ${isUploading && uploadContext?.type === 'master' && uploadContext?.id === m.id ? 'opacity-100 pointer-events-none' : ''}`}
                        >
                          {isUploading && uploadContext?.type === 'master' && uploadContext?.id === m.id ? (
                            <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Banana className="w-4 h-4 text-white" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              setUploadContext({ type: 'master', id: m.id });
                              try {
                                const url = await uploadFile(file, 'masters');
                                await updateMaster(m.id, { photoURL: url });
                              } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar';
                                showAlert(errorMessage);
                              } finally {
                                setIsUploading(false);
                                setUploadContext(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          defaultValue={m.name}
                          onBlur={(e) => updateMaster(m.id, { name: e.target.value })}
                          className="w-full bg-transparent border-none text-sm font-bold text-white p-0 focus:ring-0"
                        />
                        <input 
                          type="text" 
                          defaultValue={m.role}
                          onBlur={(e) => updateMaster(m.id, { role: e.target.value })}
                          className="w-full bg-transparent border-none text-[10px] font-bold text-incendeia-red p-0 focus:ring-0 uppercase"
                        />
                      </div>
                      <button onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir este mestre?', '¿Eliminar este maestro?'), () => deleteMaster(m.id))} className="p-2 text-zinc-600 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea 
                      defaultValue={m.bio}
                      onBlur={(e) => updateMaster(m.id, { bio: e.target.value })}
                      className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] text-zinc-400 outline-none focus:border-incendeia-red min-h-[60px]"
                      placeholder={t('Biografia...', 'Biografía...')}
                    />
                  </div>
                ))}
              </div>
            )}

            {contentSubTab === 'store' && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => addStoreItem({ name: 'Novo Produto', price: 0, description: '', imageUrl: 'https://picsum.photos/seed/store/200/200', category: 'Uniforme' })}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-incendeia-red hover:text-incendeia-red transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('ADICIONAR PRODUTO', 'AÑADIR PRODUCTO')}
                </button>
                {storeItems.map(item => (
                  <div key={item.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                          <LazyImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <label 
                          className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer rounded-xl ${isUploading && uploadContext?.type === 'store' && uploadContext?.id === item.id ? 'opacity-100 pointer-events-none' : ''}`}
                        >
                          {isUploading && uploadContext?.type === 'store' && uploadContext?.id === item.id ? (
                            <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Banana className="w-4 h-4 text-white" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              setUploadContext({ type: 'store', id: item.id });
                              try {
                                const url = await uploadFile(file, 'store');
                                await updateStoreItem(item.id, { imageUrl: url });
                              } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar';
                                showAlert(errorMessage);
                              } finally {
                                setIsUploading(false);
                                setUploadContext(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          defaultValue={item.name}
                          onBlur={(e) => updateStoreItem(item.id, { name: e.target.value })}
                          className="w-full bg-transparent border-none text-sm font-bold text-white p-0 focus:ring-0"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-500">R$</span>
                          <input 
                            type="number" 
                            defaultValue={item.price}
                            onBlur={(e) => updateStoreItem(item.id, { price: Number(e.target.value) })}
                            className="w-20 bg-transparent border-none text-sm font-bold text-incendeia-red p-0 focus:ring-0"
                          />
                        </div>
                      </div>
                      <button onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir este produto?', '¿Eliminar este producto?'), () => deleteStoreItem(item.id))} className="p-2 text-zinc-600 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {contentSubTab === 'branches' && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => addBranch({ 
                    name: 'Nova Filial', 
                    imageUrl: 'https://picsum.photos/seed/branch/400/300', 
                    mapUrl: '', 
                    contact: '', 
                    trainingDays: ['Seg', 'Qua'], 
                    trainingHours: '19:00', 
                    location: '' 
                  })}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-incendeia-red hover:text-incendeia-red transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('ADICIONAR FILIAL', 'AÑADIR FILIAL')}
                </button>
                {branches.map(b => (
                  <div key={b.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                          <LazyImage src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" />
                        </div>
                        <label 
                          className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer rounded-xl ${isUploading && uploadContext?.type === 'gallery' && uploadContext?.id === b.id ? 'opacity-100 pointer-events-none' : ''}`}
                        >
                          {isUploading && uploadContext?.type === 'gallery' && uploadContext?.id === b.id ? (
                            <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Banana className="w-4 h-4 text-white" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              setUploadContext({ type: 'gallery', id: b.id }); // Using gallery type for branch image upload
                              try {
                                const url = await uploadFile(file, 'branches');
                                await updateBranch(b.id, { imageUrl: url });
                              } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar';
                                showAlert(errorMessage);
                              } finally {
                                setIsUploading(false);
                                setUploadContext(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          defaultValue={b.name}
                          onBlur={(e) => addBranch({ ...b, name: e.target.value })}
                          className="w-full bg-transparent border-none text-sm font-bold text-white p-0 focus:ring-0"
                        />
                        <p className="text-[8px] text-zinc-500 uppercase font-bold">{b.location || 'Sem localização'}</p>
                      </div>
                      <button onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir esta filial?', '¿Eliminar esta filial?'), () => deleteBranch(b.id))} className="p-2 text-zinc-600 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {contentSubTab === 'events' && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => addEvent({ title: 'Novo Evento', description: '', date: new Date(), location: '', type: 'training' })}
                  className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-incendeia-red hover:text-incendeia-red transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('ADICIONAR EVENTO', 'AÑADIR EVENTO')}
                </button>
                {events.map(ev => (
                  <div key={ev.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="relative group shrink-0 mr-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex items-center justify-center border border-white/5">
                          {ev.imageUrl ? (
                            <LazyImage src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <Banana className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <label 
                          className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer rounded-xl ${isUploading && uploadContext?.type === 'event' && uploadContext?.id === ev.id ? 'opacity-100 pointer-events-none' : ''}`}
                        >
                          {isUploading && uploadContext?.type === 'event' && uploadContext?.id === ev.id ? (
                            <div className="w-4 h-4 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Banana className="w-4 h-4 text-white" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              setUploadContext({ type: 'event', id: ev.id });
                              try {
                                const url = await uploadFile(file, 'events');
                                await updateEvent(ev.id, { imageUrl: url });
                              } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar';
                                showAlert(errorMessage);
                              } finally {
                                setIsUploading(false);
                                setUploadContext(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        defaultValue={ev.title}
                        onBlur={(e) => updateEvent(ev.id, { title: e.target.value })}
                        className="flex-1 bg-transparent border-none text-sm font-bold text-white p-0 focus:ring-0"
                      />
                      <button onClick={() => showConfirm(t('EXCLUIR', 'ELIMINAR'), t('Excluir este evento?', '¿Eliminar este evento?'), () => deleteEvent(ev.id))} className="p-2 text-zinc-600 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="datetime-local" 
                        defaultValue={ev.date instanceof Date ? ev.date.toISOString().slice(0, 16) : ev.date?.toDate?.().toISOString().slice(0, 16)}
                        onChange={(e) => updateEvent(ev.id, { date: new Date(e.target.value) })}
                        className="bg-black/30 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none"
                      />
                      <select 
                        value={ev.type}
                        onChange={(e) => updateEvent(ev.id, { type: e.target.value as any })}
                        className="bg-black/30 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none uppercase font-bold"
                      >
                        <option value="training">{t('TREINO', 'ENTRENO')}</option>
                        <option value="roda">{t('RODA', 'RODA')}</option>
                        <option value="workshop">{t('WORKSHOP', 'WORKSHOP')}</option>
                        <option value="event">{t('EVENTO', 'EVENTO')}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div 
            key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Sub Tabs */}
            <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
              {[
                { id: 'general', icon: Settings, label: t('GERAL', 'GENERAL') },
                { id: 'banners', icon: ImageIcon, label: t('BANNERS', 'BANNERS') },
                { id: 'social', icon: Globe, label: t('REDES', 'REDES') }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setConfigSubTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${configSubTab === tab.id ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {configSubTab === 'general' && (
              <div className="flex flex-col gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('MURAL DE AVISOS', 'MURAL DE AVISOS')}</label>
                  <textarea 
                    defaultValue={appConfig?.mural}
                    onBlur={(e) => handleUpdateConfig({ mural: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-incendeia-red min-h-[120px] resize-none"
                    placeholder={t('Escreva um aviso para todos os membros...', 'Escriba un aviso para todos los miembros...')}
                  />
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('FUNÇÕES ATIVAS', 'FUNCIONES ACTIVAS')}</label>
                  <div className="flex flex-col gap-3">
                    {[
                      { id: 'geminiEnabled', label: t('ASSISTENTE IA', 'ASISTENTE IA') },
                      { id: 'galleryEnabled', label: t('GALERIA', 'GALERIA') },
                      { id: 'storeEnabled', label: t('LOJA', 'TIENDA') },
                      { id: 'chatEnabled', label: t('CHAT', 'CHAT') }
                    ].map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{f.label}</span>
                        <button 
                          onClick={() => handleUpdateConfig({ 
                            features: { ...appConfig?.features, [f.id]: !appConfig?.features?.[f.id as keyof typeof appConfig.features] } as any
                          })}
                          className={`w-10 h-5 rounded-full relative transition-all ${appConfig?.features?.[f.id as keyof typeof appConfig.features] ? 'bg-incendeia-red' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${appConfig?.features?.[f.id as keyof typeof appConfig.features] ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('MODO DESENVOLVEDOR', 'MODO DESARROLLADOR')}</label>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{t('ATIVAR LOGS', 'ACTIVAR LOGS')}</span>
                      <span className="text-[7px] text-zinc-600 uppercase">{t('Exibe informações técnicas de depuração', 'Muestra información técnica de depuración')}</span>
                    </div>
                    <button 
                      onClick={() => setDeveloperMode(!developerMode)}
                      className={`w-10 h-5 rounded-full relative transition-all ${developerMode ? 'bg-incendeia-red' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${developerMode ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                {developerMode && (
                  <div className="bg-black p-4 rounded-2xl border border-incendeia-red/20 font-mono text-[8px] max-h-[300px] overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                      <span className="text-incendeia-red font-bold uppercase tracking-widest">{t('LOGS DO SISTEMA', 'LOGS DEL SISTEMA')}</span>
                      <button onClick={() => addLog('Logs limpos')} className="text-zinc-600 hover:text-white uppercase">{t('LIMPAR', 'LIMPIAR')}</button>
                    </div>
                    {logs.length === 0 ? (
                      <div className="text-zinc-700 py-4 text-center italic">{t('Nenhum log registrado', 'Ningún log registrado')}</div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {logs.map((log, i) => (
                          <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-500' : log.type === 'warn' ? 'text-yellow-500' : 'text-zinc-400'}`}>
                            <span className="text-zinc-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="flex-1 break-all">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {configSubTab === 'banners' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label 
                    className={`w-full py-12 border-2 border-dashed border-white/10 rounded-3xl text-sm font-black-ops text-zinc-500 uppercase tracking-[0.2em] hover:border-incendeia-red hover:text-incendeia-red transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative bg-zinc-900/40 group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isUploading && uploadContext?.type === 'banner' ? (
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-10 h-10 border-4 border-incendeia-orange border-t-transparent rounded-full animate-spin" />
                         <span className="text-incendeia-orange font-bold text-xs">{Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform">
                          <Plus className="w-8 h-8 text-white" />
                        </div>
                        <span>{t('ADICIONAR BANNER LOCAL', 'AÑADIR BANNER LOCAL')}</span>
                      </>
                    )}
                    <input type="file" onChange={(e) => handleDirectUpload(e, 'banner')} className="hidden" accept="image/*,video/*" disabled={isUploading} />
                  </label>
                </div>
                <div className="flex flex-col gap-4">
                  {appConfig?.banners && appConfig.banners.length > 0 ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group bg-black/40">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentBannerIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full absolute inset-0"
                        >
                          <LazyImage src={appConfig.banners[currentBannerIndex]} alt={`Banner ${currentBannerIndex}`} className="w-full h-full object-cover" />
                        </motion.div>
                      </AnimatePresence>
                      
                      {/* Carousel Controls */}
                      {appConfig.banners.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentBannerIndex((prev) => (prev > 0 ? prev - 1 : appConfig.banners!.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-incendeia-orange text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setCurrentBannerIndex((prev) => (prev < appConfig.banners!.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-incendeia-orange text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Delete Button */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            const newBanners = appConfig.banners?.filter((_, i) => i !== currentBannerIndex);
                            handleUpdateConfig({ banners: newBanners });
                            if (currentBannerIndex >= (newBanners?.length || 0)) {
                              setCurrentBannerIndex(Math.max(0, (newBanners?.length || 1) - 1));
                            }
                          }}
                          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg backdrop-blur-md transition-all flex items-center gap-2"
                        >
                          <Trash className="w-5 h-5" />
                          <span className="text-xs font-bold font-black-ops tracking-widest">{t('EXCLUIR', 'ELIMINAR')}</span>
                        </button>
                      </div>

                      {/* Carousel Indicators */}
                      {appConfig.banners.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {appConfig.banners.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentBannerIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-incendeia-orange w-6' : 'bg-white/50 hover:bg-white'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                      <p className="text-zinc-500 font-bold tracking-widest uppercase">{t('NENHUM BANNER CARREGADO', 'NINGÚN BANNER CARGADO')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {configSubTab === 'social' && (
              <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                {[
                  { id: 'instagram', icon: Instagram, label: 'Instagram' },
                  { id: 'facebook', icon: Facebook, label: 'Facebook' },
                  { id: 'youtube', icon: Play, label: 'YouTube' },
                  { id: 'website', icon: Globe, label: 'Website' }
                ].map(social => (
                  <div key={social.id} className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                      <social.icon className="w-2 h-2" /> {social.label}
                    </label>
                    <input 
                      type="text" 
                      defaultValue={appConfig?.socialLinks?.[social.id as keyof typeof appConfig.socialLinks]}
                      onBlur={(e) => handleUpdateConfig({ 
                        socialLinks: { ...appConfig?.socialLinks, [social.id]: e.target.value } 
                      })}
                      placeholder="https://..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-incendeia-red"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'style' && (
          <motion.div 
            key="style" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('LOGO DO APP', 'LOGO DEL APP')}</label>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col gap-2">
                  <label 
                    className={`w-32 h-32 rounded-2xl border-2 border-dashed ${appConfig?.logoUrl ? 'border-incendeia-red' : 'border-white/20'} flex items-center justify-center overflow-hidden cursor-pointer relative group bg-black/30 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {appConfig?.logoUrl ? (
                      <LazyImage src={appConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Banana className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{t('UPLOAD LOGO', 'SUBIR LOGO')}</span>
                      </div>
                    )}
                    {isUploading && uploadContext?.type === 'logo' && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-incendeia-orange border-t-transparent rounded-full animate-spin mb-2" />
                        {uploadProgress > 0 && (
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-incendeia-orange shadow-[0_0_10px_rgba(255,102,0,0.8)]"
                            />
                          </div>
                        )}
                        <span className="text-white text-[10px] font-bold mt-1">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    <input type="file" onChange={(e) => handleDirectUpload(e, 'logo')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,video/*" disabled={isUploading} />
                  </label>
                  <div className="flex gap-2">
                    <label className="bg-blue-600/20 border border-blue-600/30 p-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600/30 transition-all">
                      <img src="https://www.gstatic.com/images/branding/product/2x/photos_96dp.png" className="w-4 h-4 object-contain" alt="Google Photos" />
                      <input type="file" onChange={(e) => handleDirectUpload(e, 'logo')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff" />
                    </label>
                    <label className="bg-white/5 border border-white/10 p-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all">
                      <img src="https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" className="w-4 h-4 object-contain" alt="Google Drive" />
                      <input type="file" onChange={(e) => handleDirectUpload(e, 'logo')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.heic,.heif,.webp,.avif,.gif,.svg,.png,.jpg,.jpeg,.bmp,.ico,.tiff" />
                    </label>
                  </div>
                </div>
                <div className="w-full">
                  <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">{t('OU INSIRA A URL', 'O INGRESE LA URL')}</label>
                  <input 
                    type="text" 
                    defaultValue={appConfig?.logoUrl}
                    onBlur={(e) => handleUpdateConfig({ logoUrl: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-incendeia-red"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('COR PRIMÁRIA', 'COLOR PRIMARIO')}</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  defaultValue={appConfig?.primaryColor}
                  onChange={(e) => handleUpdateConfig({ primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <span className="text-sm font-mono text-zinc-400 uppercase">{appConfig?.primaryColor}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">{t('FONTE PRINCIPAL', 'FUENTE PRINCIPAL')}</label>
              <select 
                defaultValue={appConfig?.fontFamily}
                onChange={(e) => handleUpdateConfig({ fontFamily: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-incendeia-red"
              >
                <option value="Black Ops One">Black Ops One (Militar)</option>
                <option value="Inter">Inter (Moderno)</option>
                <option value="Space Grotesk">Space Grotesk (Tech)</option>
                <option value="Outfit">Outfit (Clean)</option>
              </select>
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div 
            key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-incendeia-red/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-incendeia-orange" />
                </div>
                <div>
                  <h4 className="text-sm font-black-ops text-white uppercase">{t('ASSISTENTE GEMINI', 'ASISTENTE GEMINI')}</h4>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{t('IA para gestão do grupo', 'IA para gestión del grupo')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-incendeia-red min-h-[100px] resize-none"
                  placeholder={t('Pergunte algo sobre como melhorar o grupo ou o app...', 'Pregunte algo sobre cómo mejorar el grupo o el app...')}
                />
                <button 
                  onClick={handleAiAsk}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="w-full py-4 bg-incendeia-red text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-incendeia-red/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isAiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-3 h-3" /> {t('PERGUNTAR', 'PREGUNTAR')}</>}
                </button>
              </div>

              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-black/50 rounded-2xl border border-incendeia-red/20"
                >
                  <p className="text-zinc-300 text-sm leading-relaxed italic">"{aiResponse}"</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = ({ setView, now, locale, logout, t }: { 
  setView: (view: View) => void; 
  now: Date; 
  locale: Locale; 
  logout: () => void; 
  t: (pt: string, es: string) => string; 
}) => {
  const { appConfig, isAdmin, notifications, user, requestNotificationPermission } = useAuth();
  const unreadCount = notifications.filter(n => !n.readBy.includes(user?.uid || '')).length;

  return (
    <div className="bg-premium-black/90 backdrop-blur-md border-b border-incendeia-red/20 p-4 sticky top-0 z-50 flex items-center justify-between">
      <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft className="w-6 h-6 text-incendeia-orange" /></button>
      <div className="flex items-center gap-3">
        <LazyImage 
          src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
          alt="Logo" 
          className="w-10 h-10"
          imgClassName="mix-blend-screen"
          objectFit="contain"
        />
        <div className="flex flex-col">
          <div className="text-[7px] font-black-ops text-zinc-500 uppercase mt-0.5">{format(now, "EEEE, dd/MM/yyyy HH:mm", { locale })}</div>
        </div>
      </div>
      <div className="flex gap-1">
        <button 
          onClick={() => {
            requestNotificationPermission();
            setView('notifications');
          }} 
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors relative"
        >
          <Bell className="w-6 h-6 text-incendeia-orange" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-white text-incendeia-red text-[8px] font-bold flex items-center justify-center rounded-full border border-incendeia-red">
              {unreadCount}
            </span>
          )}
        </button>
        {isAdmin && (
          <button onClick={() => setView('admin-panel')} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Settings className="w-6 h-6 text-incendeia-orange" />
          </button>
        )}
        <button onClick={logout} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><LogOut className="w-6 h-6 text-incendeia-orange" /></button>
      </div>
    </div>
  );
};

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

const SplashScreen = ({ onComplete, logoUrl }: { onComplete: () => void; logoUrl?: string | null }) => {
  const { appConfig } = useAuth();
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
      {appConfig?.uiStyle?.smokeEnabled !== false && <SmokeEffect />}
      
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
          {appConfig?.uiStyle?.fireEnabled !== false && (
            <>
              <div className="absolute -inset-8 rounded-full border-4 border-incendeia-red/30 animate-fire fire-glow" />
              <div className="absolute -inset-12 rounded-full border-2 border-incendeia-orange/20 animate-fire [animation-delay:-2s]" />
            </>
          )}
          
          <img 
            src={logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
            alt="Logo" 
            className="w-64 h-64 md:w-72 md:h-72 object-contain mix-blend-screen drop-shadow-[0_0_30px_rgba(204,0,0,0.8)]" 
            referrerPolicy="no-referrer" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/capoeira-logo/400/400";
            }}
          />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-8 text-center z-10"
      >
        <div className="flex flex-col items-center gap-2 mt-8">
          <MainTitle size="sm" />
        </div>
        <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-incendeia-red to-transparent mt-8 mx-auto opacity-50" />
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
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
    allUsers,
    appConfig,
    updateAppConfig,
    developerMode,
    setDeveloperMode,
    logs,
    addLog,
    unreadNotificationsCount
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
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as View;
      const validViews = [
        'splash', 'login', 'auth', 'home', 'profile', 'edit-profile', 
        'gallery', 'masters', 'calendar', 'store', 'finance', 'chat', 
        'users', 'admin-panel', 'ai-chat', 'notifications', 'graduations', 'branches'
      ];
      if (validViews.includes(hash)) {
        setView(hash);
      }
    };
    // Initialize view from hash if present
    if (window.location.hash) {
      onHashChange();
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (view && view !== 'splash') {
      if (window.location.hash !== `#${view}`) {
        window.history.replaceState(null, '', `#${view}`);
      }
    }
  }, [view]);

  useEffect(() => {
    if (loading) return;
    
    console.log('Navigation check:', { user: user?.uid, view, loading });

    if (user && (view === 'login' || view === 'auth' || view === 'splash')) {
      console.log('Redirecting to home because user is logged in');
      setView('home');
    }
    
    if (!user && view !== 'login' && view !== 'auth' && view !== 'splash') {
      console.log('Redirecting to login because user is not logged in');
      setView('login');
    }
  }, [user, loading, view]);

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

  const handleAuth = async (email: string, nickname: string, password: string, photoURL?: string) => {
    try {
      if (authMode === 'login') {
        await loginFn(nickname, password);
      } else {
        await registerFn(email, nickname, password, photoURL || '', authRole);
      }
      setView('home');
      return null;
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const errorCode = (error as any)?.code || "";
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        return t('Apelido ou senha incorretos', 'Apodo o contraseña incorrectos');
      }
      if (errorCode === 'auth/invalid-email') {
        return t('Email ou apelido inválido', 'Email o apodo inválido');
      }
      if (errorCode === 'auth/email-already-in-use') {
        return t('Este apelido já está em uso', 'Este apodo ya está en uso');
      }
      if (errorCode === 'auth/weak-password') {
        return t('A senha é muito fraca', 'La contraseña es muy débil');
      }
      if (errorCode === 'auth/operation-not-allowed') {
        return t(
          'Método de login por Email/Senha não está ativado. Ative-o na aba Authentication do projeto no Firebase Console.', 
          'El método de inicio de sesión por Correo/Contraseña no está activado. Actívelo en la pestaña Authentication del proyecto en Firebase Console.'
        );
      }
      if (errorCode === 'auth/configuration-not-found') {
        return t(
          'Configuração do Firebase ausente. Ative o provedor de Email na aba Authentication no Console do Firebase.',
          'Configuración de Firebase ausente. Active el proveedor de Email en la pestaña Authentication en el Consola de Firebase.'
        );
      }
      return (error as any).message || t("Erro na autenticação", "Error en la autenticación");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-premium-black flex flex-col items-center justify-center p-8">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-24 h-24 mb-6"
      >
        <img 
          src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
          className="w-full h-full object-contain mix-blend-screen" 
          alt="Loading..."
        />
      </motion.div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-incendeia-red border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-black-ops tracking-widest text-[10px] uppercase animate-pulse">
          {t('CARREGANDO ENERGIA...', 'CARGANDO ENERGÍA...')}
        </p>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-premium-black relative"
    >
      <DynamicStyles config={appConfig} />
      <AnimatePresence mode="wait">
        {view === 'splash' ? (
          <SplashScreen key="splash" logoUrl={appConfig?.logoUrl} onComplete={() => setView(user ? 'home' : 'login')} />
        ) : view === 'login' ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginView t={t} setAuthRole={setAuthRole} setView={setView} setLang={setLang} setAuthMode={setAuthMode} appConfig={appConfig} />
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
              appConfig={appConfig}
            />
          </motion.div>
        ) : view === 'test-db' ? (
          <motion.div key="test-db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <TestDbView setView={setView} />
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
                    <MessageSquare className="w-5 h-5 text-incendeia-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-incendeia-red uppercase tracking-widest leading-none mb-1">{showToast.author}</p>
                    <p className="text-white text-sm truncate">{showToast.text}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 rotate-180" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'home' && <HomeView t={t} setView={setView} profile={profile} hasNewMessages={hasNewMessages} isAdmin={isAdmin} appConfig={appConfig} />}
                {view === 'profile' && <ProfileView t={t} setView={setView} profile={profile} logout={logout} showConfirm={showConfirm} isAdmin={isAdmin} />}
                {view === 'edit-profile' && <EditProfileView t={t} initialData={profile as UserProfile} handleSaveProfile={handleSaveProfile} setView={setView} showAlert={showAlert} />}
                {view === 'gallery' && <GalleryView t={t} setView={setView} isAdmin={isAdmin} showConfirm={showConfirm} showAlert={showAlert} />}
                {view === 'masters' && <MastersView t={t} showConfirm={showConfirm} />}
                {view === 'calendar' && <CalendarView t={t} showConfirm={showConfirm} />}
                {view === 'store' && <StoreView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
                {view === 'finance' && <FinanceView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
                {view === 'admin-panel' && <AdminPanelView t={t} showConfirm={showConfirm} showAlert={showAlert} />}
                {view === 'ai-chat' && <AIChatView t={t} />}
                {view === 'notifications' && <NotificationsView setView={setView} t={t} />}
                {view === 'graduations' && <GraduationsView t={t} />}
                {view === 'branches' && <BranchesView t={t} showConfirm={showConfirm} />}
                {view === 'chat' && <ChatView t={t} messages={messages} sendMessage={sendMessage} deleteMessage={deleteMessage} user={profile} isAdmin={isAdmin} showConfirm={showConfirm} showAlert={showAlert} />}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-incendeia-orange/20 p-4 flex justify-around items-center z-50">
              <button onClick={() => setView('home')} className={`p-2 rounded-full transition-all ${view === 'home' ? 'bg-incendeia-orange text-white scale-110 shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'text-incendeia-orange hover:text-white'}`}>
                <Home className="w-6 h-6" />
              </button>
              <button onClick={() => setView('chat')} className={`p-2 rounded-full transition-all relative ${view === 'chat' ? 'bg-incendeia-orange text-white scale-110 shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'text-incendeia-orange hover:text-white'}`}>
                <MessageSquare className="w-6 h-6" />
                {hasNewMessages && view !== 'chat' && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-white border-2 border-incendeia-orange rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                )}
              </button>
              <button onClick={() => setView('store')} className={`p-2 rounded-full transition-all ${view === 'store' ? 'bg-incendeia-orange text-white scale-110 shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'text-incendeia-orange hover:text-white'}`}>
                <ShoppingBag className="w-6 h-6" />
              </button>
              <button onClick={() => setView('profile')} className={`p-2 rounded-full transition-all ${view === 'profile' || view === 'edit-profile' ? 'bg-incendeia-orange text-white scale-110 shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'text-incendeia-orange hover:text-white'}`}>
                <User className="w-6 h-6" />
              </button>
              <button onClick={() => setIsMenuOpen(true)} className={`p-2 transition-all ${isMenuOpen ? 'text-white' : 'text-incendeia-orange hover:text-white'}`}>
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
                      <img 
                        src={appConfig?.logoUrl || "https://i.ibb.co/TDC785K4/file-00000000e97c720eaa21fb077e22504c.png"} 
                        className="w-12 h-12 object-contain" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://picsum.photos/seed/capoeira-logo/400/400";
                        }}
                      />
                      <button onClick={() => setIsMenuOpen(false)}><X className="w-6 h-6 text-incendeia-orange" /></button>
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
                        isAdmin && { id: 'admin-panel', icon: Settings, label: t('PAINEL ADM', 'PANEL ADM') },
                      ].filter((item): item is any => !!item).map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => { setView(item.id as View); setIsMenuOpen(false); }}
                          className="flex items-center justify-between p-3 hover:bg-incendeia-orange/10 rounded-xl transition-colors text-zinc-300 hover:text-white font-black-ops text-sm group"
                        >
                          <div className="flex items-center gap-4">
                            <item.icon className="w-5 h-5 text-incendeia-orange" />
                            {item.label}
                          </div>
                          {item.hasNotification && (
                            <span className="w-2 h-2 bg-incendeia-orange rounded-full animate-pulse shadow-[0_0_5px_rgba(255,102,0,0.5)]" />
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
