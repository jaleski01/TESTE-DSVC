
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { Wrapper } from '../components/Wrapper';
import { DailyHabits } from '../components/DailyHabits';
import { ShortcutPrompt } from '../components/ShortcutPrompt';
import { HoldToConfirmButton } from '../components/HoldToConfirmButton';
import { StreakRecoveryModal } from '../components/StreakRecoveryModal';
import { DailyCheckInModal } from '../components/DailyCheckInModal';
import { EpitaphModal } from '../components/EpitaphModal'; 
import { MissionSwipeCard } from '../components/MissionSwipeCard';
import { COLORS, Routes, UserProfile, DAILY_MISSIONS, DailyMission } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  getTodayString, 
  verifyAndResetStreak, 
  restoreStreak,
  forceResetStreak,
} from '../services/gamificationService';
import { Brain, Sparkles, BookOpen, Check, Feather, Wind, Activity, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile: profile, loading: isLoading, updateLocalProfile } = useData();
  
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isEpitaphModalOpen, setIsEpitaphModalOpen] = useState(false); 
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  
  // Mission Selector State
  const [acceptedMissions, setAcceptedMissions] = useState<DailyMission[]>([]);
  const [currentMission, setCurrentMission] = useState<DailyMission | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [missionsRefreshKey, setMissionsRefreshKey] = useState(0);

  // Debug State
  const [debugClicks, setDebugClicks] = useState(0);
  const debugTimerRef = useRef<any>(null);

  const todayStr = getTodayString();
  const MISSION_STORAGE_KEY = `@daily_missions_selecao_${todayStr}`;
  const currentStreak = profile?.currentStreak || 0;
  const isCheckedInToday = profile?.lastCheckInDate === todayStr;

  // --- LÓGICA DO EPITÁFIO ---
  let isEpitaphDay = false;
  let effectiveDay = currentStreak;

  if (!isCheckedInToday) {
    const potentialStreak = currentStreak + 1;
    isEpitaphDay = (currentStreak === 0) || (potentialStreak > 0 && potentialStreak % 7 === 0);
    effectiveDay = (currentStreak === 0) ? 0 : potentialStreak;
  } else {
    isEpitaphDay = (currentStreak === 1) || (currentStreak > 0 && currentStreak % 7 === 0);
    effectiveDay = (currentStreak === 1) ? 0 : currentStreak;
  }

  const isUpcomingEpitaph = !isCheckedInToday && (currentStreak === 0 || (currentStreak + 1) % 7 === 0);
  const localToday = new Date().toLocaleDateString('en-CA');
  const hasWrittenToday = profile?.last_epitaph_date === localToday;
  const showEpitaphCard = isEpitaphDay && !hasWrittenToday;
  const isGoldenHour = isEpitaphDay && !hasWrittenToday;

  // Initialize Missions
  useEffect(() => {
    const saved = localStorage.getItem(MISSION_STORAGE_KEY);
    if (saved) {
      setAcceptedMissions(JSON.parse(saved));
    }

    const getRandomMission = (currentAccepted: DailyMission[]) => {
      const acceptedIds = currentAccepted.map(m => m.id);
      const available = DAILY_MISSIONS.filter(m => !acceptedIds.includes(m.id));
      return available[Math.floor(Math.random() * available.length)];
    };

    if (!currentMission) {
      setCurrentMission(getRandomMission(acceptedMissions));
    }

    const checkStreak = async () => {
      if (profile && auth.currentUser) {
        const result = await verifyAndResetStreak(auth.currentUser.uid, profile);
        if (result.streakStatus === 'NEEDS_RECOVERY') {
          setShowRecoveryModal(true);
        } else if (result.streakStatus === 'RESET') {
          updateLocalProfile({ currentStreak: 0, lastCheckInDate: getTodayString() });
        }
      }
    };
    
    if (profile) checkStreak();
  }, [profile?.uid, MISSION_STORAGE_KEY]);

  const handleMissionSwipe = async (direction: 'left' | 'right') => {
    if (!currentMission) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(direction === 'right' ? [20, 10, 20] : 10);
    }

    if (direction === 'right') {
      const newAccepted = [...acceptedMissions, currentMission];
      setAcceptedMissions(newAccepted);
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(newAccepted));
      
      if (newAccepted.length >= 3) {
        setCurrentMission(null);
        // Sincroniza com o Firestore quando o arsenal é definido
        if (auth.currentUser) {
          try {
            const historyRef = doc(db, "users", auth.currentUser.uid, "daily_history", todayStr);
            await setDoc(historyRef, { 
              selected_missions: newAccepted, 
              date: todayStr 
            }, { merge: true });
          } catch (e) {
            console.warn("Failed to sync missions to cloud", e);
          }
        }
        setMissionsRefreshKey(prev => prev + 1);
        return;
      }
    }

    // Carrega próxima missão
    const acceptedIds = direction === 'right' 
      ? [...acceptedMissions, currentMission].map(m => m.id)
      : acceptedMissions.map(m => m.id);
    
    const available = DAILY_MISSIONS.filter(m => !acceptedIds.includes(m.id) && m.id !== currentMission.id);
    setCurrentMission(available[Math.floor(Math.random() * available.length)]);
  };

  const handleDebugAction = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      // 1. Simula a passagem do tempo ajustando o check-in para ontem
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayString = yesterdayDate.toISOString().split('T')[0];
      const newStreak = (profile.currentStreak || 0) + 1;
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        currentStreak: newStreak,
        lastCheckInDate: yesterdayString
      });
      updateLocalProfile({ ...profile, currentStreak: newStreak, lastCheckInDate: yesterdayString });

      // 2. Invalidação de Cache Local (Força a limpeza das missões do dia real)
      localStorage.removeItem(`@daily_missions_selecao_${todayStr}`);
      localStorage.removeItem(`@daily_missions_progresso_${todayStr}`);

      // 3. Reset do Estado no Firestore para o dia atual (Evita que o DailyHabits puxe os dados antigos da nuvem)
      const historyRef = doc(db, "users", auth.currentUser.uid, "daily_history", todayStr);
      await setDoc(historyRef, {
        selected_missions: null,
        habits_ids: [],
        completed_count: 0,
        percentage: 0
      }, { merge: true });

      // 4. Limpeza de Estados Locais da UI (Atualiza a interface em O(1))
      setAcceptedMissions([]);
      // Sorteia uma nova missão inicial para a pilha
      const randomMission = DAILY_MISSIONS[Math.floor(Math.random() * DAILY_MISSIONS.length)];
      setCurrentMission(randomMission);
      // Força o componente DailyHabits a re-renderizar lendo os dados vazios
      setMissionsRefreshKey(prev => prev + 1);

      alert(`DEBUG: Dia avançado para ${newStreak}. Arsenal de missões resetado para testes.`);
    } catch (error) { 
      console.error("Erro crítico na ação de debug:", error); 
    }
  };

  const handleStatusClick = () => {
    setDebugClicks(prev => {
      const newCount = prev + 1;
      if (debugTimerRef.current) clearTimeout(debugTimerRef.current);
      debugTimerRef.current = setTimeout(() => setDebugClicks(0), 2000);
      if (newCount === 3) { handleDebugAction(); return 0; }
      return newCount;
    });
  };

  const handleRecoverySuccess = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const updatedProfile = await restoreStreak(auth.currentUser.uid, profile);
      updateLocalProfile({ ...updatedProfile, lastCheckInDate: getTodayString() });
      setShowRecoveryModal(false);
      setShowConfetti(true);
    } catch (error) { console.error(error); }
  };

  const handleRecoveryFail = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const updateData = await forceResetStreak(auth.currentUser.uid);
      updateLocalProfile({ ...updateData, currentStreak: 0, lastCheckInDate: getTodayString() });
      setShowRecoveryModal(false);
    } catch (error) { console.error(error); }
  };

  const handleCheckInSuccess = (updatedProfile: UserProfile) => {
    if (updatedProfile.currentStreak && updatedProfile.currentStreak > (profile?.currentStreak || 0)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    updateLocalProfile(updatedProfile);
  };

  const handleEpitaphSuccess = () => {
    updateLocalProfile({ last_epitaph_date: getTodayString() });
  };

  if (isLoading && !profile) {
    return (
      <div className="flex-1 h-[100dvh] w-full flex flex-col items-center justify-center bg-black">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <Wrapper noPadding hideNavigation={false} disableDefaultBackground={true}> 
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 opacity-100">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-full max-w-full px-5 pt-8 pb-24 flex flex-col items-center">
          
          <header className="w-full flex items-center justify-between mb-8 px-1">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Sua Jornada
              </h1>
            </div>
            <div onClick={handleStatusClick} className="w-2 h-2 rounded-full cursor-pointer transition-all bg-emerald-500/50" />
          </header>

          <motion.section className="w-full mb-4 relative flex flex-col items-center justify-center py-6">
            <div className="relative z-10 flex flex-col items-center w-full">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-violet-300/70">
                Foco Contínuo
              </span>
              <div className="flex items-baseline gap-2 mb-10">
                <h2 className="text-7xl font-light tracking-tighter text-white">
                  {profile?.currentStreak || 0}
                </h2>
                <span className="text-sm font-medium uppercase text-violet-200/50">
                  {(profile?.currentStreak || 0) === 1 ? 'Dia' : 'Dias'}
                </span>
              </div>

              {isCheckedInToday ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                  <div className="py-3 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 backdrop-blur-md">
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Compromisso Honrado</span>
                  </div>
                  {showEpitaphCard && (
                    <button onClick={() => setIsEpitaphModalOpen(true)} className="w-full group rounded-2xl border border-violet-500/30 p-4 bg-violet-900/20 backdrop-blur-md flex items-center justify-center gap-3">
                        <Feather size={16} className="text-violet-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-violet-100">Registrar Legado</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
                  {isGoldenHour ? (
                    <button onClick={() => setIsCheckInModalOpen(true)} className="w-full bg-[#0F0A15]/80 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-violet-500/30">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center"><Crown size={20} className="text-violet-400" /></div>
                        <div className="flex-1 text-left"><h3 className="text-sm font-black text-white uppercase tracking-wide">Dia de Reflexão</h3></div>
                        <Feather size={20} className="text-violet-400" />
                    </button>
                  ) : (
                    <HoldToConfirmButton onComplete={() => setIsCheckInModalOpen(true)} />
                  )}

                  {/* AVISO DE EPITÁFIO DISPONÍVEL */}
                  {isUpcomingEpitaph && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center justify-center gap-2 text-violet-400/80 bg-violet-500/10 py-2 px-5 rounded-full border border-violet-500/20 w-fit"
                    >
                      <Feather size={14} className="text-violet-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Epitáfio disponível</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* MISSION SELECTOR SECTION */}
          <motion.section className="w-full mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
                <Zap size={16} className="text-violet-400" />
                {acceptedMissions.length < 3 ? 'Selecionar Missões' : 'Missões Ativas'}
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border text-violet-300 bg-violet-500/10 border-violet-500/20">
                <span>{acceptedMissions.length}</span>
                <span className="opacity-50">/</span>
                <span>3</span>
              </div>
            </div>

            <div className="relative w-full flex flex-col items-center">
              {acceptedMissions.length < 3 && currentMission ? (
                <MissionSwipeCard mission={currentMission} onSwipe={handleMissionSwipe} />
              ) : (
                <div className="w-full p-8 rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center text-center backdrop-blur-md transition-colors">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-violet-500">
                    <Check size={24} className="text-white" />
                  </div>
                  <h4 className="text-base font-bold mb-2 text-white">Arsenal Definido</h4>
                  <p className="text-sm text-gray-400 font-light max-w-[220px]">Suas 3 missões diárias estão prontas. Complete-as abaixo.</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* RITUALS SECTION */}
          <motion.div className="w-full">
            <div className="mb-4 px-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
                <Sparkles size={16} className="text-violet-400" />
                Rituais
              </h3>
            </div>
            <DailyHabits profile={profile} refreshTrigger={missionsRefreshKey} />
          </motion.div>

          <motion.div className="mt-8 w-full px-2">
            <button onClick={() => navigate(Routes.SOS)} className="w-full h-16 rounded-2xl relative overflow-hidden group shadow-lg active:scale-[0.98] transition-transform">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 opacity-90" />
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                <Wind className="text-white animate-pulse" size={20} />
                <span className="text-sm font-bold text-white uppercase tracking-widest">Respirar / S.O.S</span>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {showRecoveryModal && profile && (
        <StreakRecoveryModal streakValue={profile.currentStreak || 0} onSuccess={handleRecoverySuccess} onFail={handleRecoveryFail} />
      )}
      {isCheckInModalOpen && profile && (
        <DailyCheckInModal profile={profile} isEpitaphDay={isEpitaphDay} hasWrittenEpitaphToday={hasWrittenToday} onClose={() => setIsCheckInModalOpen(false)} onSuccess={handleCheckInSuccess} />
      )}
      {isEpitaphModalOpen && profile && (
        <EpitaphModal dayNumber={effectiveDay} onClose={() => setIsEpitaphModalOpen(false)} onSuccess={handleEpitaphSuccess} />
      )}
      <ShortcutPrompt />
    </Wrapper>
  );
};
