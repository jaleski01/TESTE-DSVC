
import React, { useState, useEffect } from 'react';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { auth, db, requestForToken } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { COLORS, Routes } from '../types';

const MOTIVATIONAL_QUOTES = [
  "O sucesso não é linear. O que define você é a velocidade com que você se levanta agora.",
  "Dia 1. De novo. Mas dessa vez, você não começa do zero, começa da experiência.",
  "A dor da disciplina é menor que a dor do arrependimento. Bem-vindo de volta à luta.",
  "Não importa quantas vezes você cai, mas quantas vezes você se levanta.",
  "O passado é uma lição, não uma sentença de prisão. Foque no agora."
];

const RANKS = [
  { id: 'consciente', label: 'Consciente', days: 7, icon: 'chevron' },
  { id: 'resiliente', label: 'Resiliente', days: 15, icon: 'shield' },
  { id: 'soberano', label: 'Soberano', days: 30, icon: 'sun' },
  { id: 'mestre', label: 'Mestre de Si', days: 90, icon: 'star' },
];

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
  );

  const [isStandalone, setIsStandalone] = useState(false);
  const [installTab, setInstallTab] = useState<'android' | 'ios'>('android');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const cached = localStorage.getItem('user_profile_cache_v1');
      if (cached) {
        const data = JSON.parse(cached);
        // MODIFICAÇÃO: Uso direto de currentStreak em vez de cálculo de data
        setStreakDays(data.currentStreak || 0);
      }
      
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             const data = snap.data();
             // MODIFICAÇÃO: Uso direto de currentStreak em vez de cálculo de data
             setStreakDays(data.currentStreak || 0);
          }
        } catch (e) {
          console.error("Erro ao sincronizar perfil", e);
        }
      }
    };

    fetchProfile();

    const checkStandalone = () => {
      const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
      setIsStandalone(isPwa);
    };
    checkStandalone();

    const checkPermissionStatus = () => {
      if ('Notification' in window) {
        if (Notification.permission !== permissionStatus) {
          setPermissionStatus(Notification.permission);
        }
      }
    };

    window.addEventListener('focus', checkPermissionStatus);
    const interval = setInterval(checkPermissionStatus, 2000);

    return () => {
      window.removeEventListener('focus', checkPermissionStatus);
      clearInterval(interval);
    };
  }, [permissionStatus]);

  /**
   * handleLogout - Protocolo Deep Clean
   * Garante a purga total de dados sensíveis e estados do navegador.
   */
  const handleLogout = async () => {
    try {
      console.log("[Security] Iniciando Protocolo Deep Clean...");

      // 1. Limpeza de Storage (Dados locais e flags)
      localStorage.clear();
      sessionStorage.clear();

      // 2. Limpeza de Cache de Navegador (PWA Cache)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log("[Security] Cache do sistema purgado.");
      }

      // 3. Desregistro de Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log("[Security] Service Workers desativados.");
      }

      // 4. Logout do Firebase
      await signOut(auth);

      // 5. Hard Reset (Limpeza de Memória RAM/React States)
      // Força o carregamento do zero para garantir que nenhum estado sensível persista.
      window.location.href = window.location.origin;

    } catch (error) {
      console.error("[Security Error] Falha no Deep Clean:", error);
      // Fallback de emergência: desloga e recarrega de qualquer forma
      await signOut(auth).catch(() => {});
      window.location.reload();
    }
  };

  const handleRelapseClick = () => {
    setShowConfirmModal(true);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const token = await requestForToken();
        if (token && auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, { fcm_token: token });
        }
      } else if (permission === 'denied') {
        alert("As notificações foram bloqueadas. Reative nas configurações do navegador.");
      }
    } catch (err) {
      console.error("Erro ao solicitar permissão:", err);
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    if (!('serviceWorker' in navigator)) {
      alert("Navegador incompatível.");
      setIsCheckingUpdate(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      let updateFound = false;
      const updateListener = () => {
        updateFound = true;
        alert("Atualizando..."); 
      };
      registration.addEventListener('updatefound', updateListener);
      await registration.update();
      setTimeout(() => {
        registration.removeEventListener('updatefound', updateListener);
        if (!updateFound) alert("Você está na versão mais recente.");
        setIsCheckingUpdate(false);
      }, 1500);
    } catch (error) {
      setIsCheckingUpdate(false);
    }
  };

  const executeRelapse = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const nowISO = new Date().toISOString();
      await updateDoc(userRef, {
        current_streak_start: nowISO,
        currentStreak: 0, // Garante zerar o contador inteiro também
        relapse_count: increment(1),
        last_relapse_date: nowISO
      });
      const todayKey = new Date().toLocaleDateString('en-CA');
      localStorage.removeItem(`@habits_${todayKey}`);
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setCurrentQuote(randomQuote);
      setStreakDays(0);
      setShowConfirmModal(false);
      setShowMotivationModal(true);
    } catch (error) {
      alert("Erro ao registrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const finishProcess = () => {
    setShowMotivationModal(false);
    navigate(Routes.DASHBOARD);
  };

  const getRankIcon = (icon: string) => {
    switch (icon) {
      case 'chevron': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />;
      case 'bars': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 10h16M4 14h16" />;
      case 'star': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />;
      case 'shield': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
      case 'sun': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />;
      default: return null;
    }
  };

  return (
    <Wrapper noPadding>
      <div className="flex flex-col items-center w-full h-full pt-8 px-4 pb-32 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 rounded-full border-2 border-[#8B5CF6] mb-3 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
             <div className="w-16 h-16 rounded-full bg-[#2E243D] flex items-center justify-center overflow-hidden">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
             </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Meu Perfil</h1>
          <p className="text-xs text-gray-400">
             {streakDays > 0 ? `${streakDays} Dias Limpos` : 'Dia 0 - O Início'}
          </p>
        </div>
        
        <div className="w-full mb-8 animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 ml-1" style={{ color: COLORS.TextSecondary }}>
            Nível de Evolução
          </h3>
          <div className="grid grid-cols-2 gap-3 w-full">
            {RANKS.map((rank) => {
              const isUnlocked = streakDays >= rank.days;
              return (
                <div 
                  key={rank.id} 
                  className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-500 
                  ${isUnlocked 
                    ? 'bg-yellow-400/10 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
                    : 'bg-[#1A1A1A] border-[#2E243D] opacity-40 grayscale'}`}
                >
                  <div className={`p-2 rounded-full transition-colors duration-500 ${isUnlocked ? 'bg-yellow-400/20' : 'bg-[#2a2a2a]'}`}>
                    <svg 
                      className={`w-6 h-6 transition-colors duration-500 ${isUnlocked ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-gray-500'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      {getRankIcon(rank.icon)}
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs font-bold block transition-colors duration-500 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{rank.label}</span>
                    <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">{rank.days} DIAS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seção de Instalação: Exibida APENAS se o app NÃO estiver instalado (isStandalone false) */}
        {!isStandalone && (
          <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">Instalar Aplicativo</h3>
              <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                <button onClick={() => setInstallTab('android')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${installTab === 'android' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Chrome</button>
                <button onClick={() => setInstallTab('ios')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${installTab === 'ios' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Safari</button>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
              {installTab === 'android' ? (
                  <p className="text-gray-300 text-xs">Toque em ⋮ e Adicionar à tela inicial.</p>
              ) : (
                  <p className="text-gray-300 text-xs">Toque em Compartilhar e Adicionar à Tela de Início.</p>
              )}
            </div>
          </div>
        )}

        <div className={`w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl p-5 mb-6 ${permissionStatus === 'granted' ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 rounded-xl shrink-0">
              <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base">Alertas do Sistema</h3>
              <p className="text-gray-400 text-xs mb-4">Ative para suporte de emergência.</p>
              <Button onClick={handleEnableNotifications} variant="primary" disabled={permissionStatus === 'granted'}>
                {permissionStatus === 'granted' ? 'Ativas ✓' : 'Ativar'}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full mb-8 p-5 rounded-2xl border border-red-900/30 bg-gradient-to-br from-[#1A0505] to-[#000000]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Zona de Perigo</h3>
          <Button onClick={handleRelapseClick} style={{ backgroundColor: '#D32F2F', color: '#FFFFFF' }}>Registrar Recaída (Zerar)</Button>
        </div>

        <div className="w-full mt-auto pt-6 border-t border-[#2E243D]">
             <Button variant="outline" onClick={handleLogout} className="text-gray-500 text-xs h-10">Encerrar Sessão</Button>
             <p className="text-[10px] text-center text-gray-700 mt-2">Versão 1.0.4 • DESVICIAR PROTOCOL</p>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0F0A15] border border-red-900/30 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Confirmar Recaída?</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-[#1F2937] text-white">Cancelar</button>
              <button onClick={executeRelapse} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white">Sim, recaí</button>
            </div>
          </div>
        </div>
      )}

      {showMotivationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Levante a Cabeça.</h2>
            <p className="text-lg font-medium text-gray-300 italic mb-8">"{currentQuote}"</p>
            <Button onClick={finishProcess} className="w-full bg-violet-600">Voltar ao Foco</Button>
          </div>
        </div>
      )}
    </Wrapper>
  );
};
