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

  // --- LÓGICA DO EPITÁFIO (BLINDADA) ---
  const streakNum = Number(profile?.currentStreak || 0); 
  const todayStr = getTodayString(); 
  const isCheckedInToday = profile?.lastCheckInDate === todayStr;
  const hasWrittenToday = profile?.last_epitaph_date === todayStr;

  let isEpitaphDay = false;
  let effectiveDay = streakNum;

  if (!isCheckedInToday) {
    const potentialStreak = streakNum + 1;
    isEpitaphDay = (streakNum === 0) || (potentialStreak > 0 && potentialStreak % 7 === 0);
    effectiveDay = (streakNum === 0) ? 0 : potentialStreak;
  } else {
    isEpitaphDay = (streakNum === 1) || (streakNum > 0 && streakNum % 7 === 0);
    effectiveDay = (streakNum === 1) ? 0 : streakNum;
  }

  const isUpcomingEpitaph = !isCheckedInToday && isEpitaphDay;
  const showEpitaphCard = isCheckedInToday && isEpitaphDay && !hasWrittenToday;
  
  // Controle do background e paleta premium dark estritamente APÓS a ofensiva no dia de epitáfio
  const isEpitaphBackgroundActive = isEpitaphDay && isCheckedInToday;
  // ----------------------------------------

  const MISSION_STORAGE_KEY = `@daily_missions_selecao_${todayStr}`;

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

    const acceptedIds = direction === 'right' 
      ? [...acceptedMissions, currentMission].map(m => m.id)
      : acceptedMissions.map(m => m.id);
    
    const available = DAILY_MISSIONS.filter(m => !acceptedIds.includes(m.id) && m.id !== currentMission.id);
    setCurrentMission(available[Math.floor(Math.random() * available.length)]);
  };

  const handleDebugAction = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const pastString = pastDate.toLocaleDateString('en-CA'); 
      const newStreak = (profile.currentStreak || 0) + 1;
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        currentStreak: newStreak,
        lastCheckInDate: pastString, 
        last_epitaph_date: pastString 
      });
      
      updateLocalProfile({ 
        ...profile, 
        currentStreak: newStreak, 
        lastCheckInDate: pastString,
        last_epitaph_date: pastString
      });

      localStorage.removeItem(`@daily_missions_selecao_${todayStr}`);
      localStorage.removeItem(`@daily_missions_progresso_${todayStr}`);

      const historyRef = doc(db, "users", auth.currentUser.uid, "daily_history", todayStr);
      await setDoc(historyRef, {
        selected_missions: null,
        habits_ids: [],
        completed_count: 0,
        percentage: 0
      }, { merge: true });

      setAcceptedMissions([]);
      const randomMission = DAILY_MISSIONS[Math.floor(Math.random() * DAILY_MISSIONS.length)];
      setCurrentMission(randomMission);
      setMissionsRefreshKey(prev => prev + 1);

      alert(`DEBUG: Dia avançado para ${newStreak}.`);
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
      {/* --- UNIFIED ATMOSPHERE BACKGROUND (DYNAMIC) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black">
        
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isEpitaphBackgroundActive ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px] bg-violet-900/10" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[80px] bg-cyan-900/10" />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-1000 ${isEpitaphBackgroundActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2A1F00] via-[#050400] to-[#000000]" />
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
          <div 
            className="absolute inset-0 opacity-[0.02] mix-blend-screen" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />
        </div>
      </div>

      <motion.div 
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-full max-w-full px-5 pt-8 pb-24 flex flex-col items-center">
          
          <header className="w-full flex items-center justify-between mb-8 px-1">
            <div className="flex flex-col">
              <span className={`text-xs font-medium transition-colors duration-500 ${isEpitaphBackgroundActive ? 'text-amber-400/60' : 'text-gray-400'}`}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Sua Jornada
              </h1>
            </div>
            <div 
              onClick={handleStatusClick} 
              className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-500 ${isEpitaphBackgroundActive ? 'bg-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-emerald-500/50'}`} 
            />
          </header>

          <motion.section className="w-full mb-4 relative flex flex-col items-center justify-center py-6">
            <div className="relative z-10 flex flex-col items-center w-full">
              <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 transition-colors duration-500 ${isEpitaphBackgroundActive ? 'text-amber-400/80' : 'text-violet-300/70'}`}>
                Foco Contínuo
              </span>
              <div className="flex items-baseline gap-2 mb-10">
                <h2 className="text-7xl font-light tracking-tighter text-white">
                  {streakNum}
                </h2>
                <span className={`text-sm font-medium uppercase transition-colors duration-500 ${isEpitaphBackgroundActive ? 'text-amber-200/60' : 'text-violet-200/50'}`}>
                  {streakNum === 1 ? 'Dia' : 'Dias'}
                </span>
              </div>

              {isCheckedInToday ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                  <div className={`py-3 px-6 rounded-full border flex items-center gap-2 backdrop-blur-md transition-colors duration-500 ${
                    isEpitaphBackgroundActive 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <Check size={16} className={isEpitaphBackgroundActive ? "text-amber-400" : "text-emerald-400"} />
                    <span className={`text-xs font-bold uppercase tracking-wide transition-colors duration-500 ${isEpitaphBackgroundActive ? "text-amber-400" : "text-emerald-400"}`}>
                      Compromisso Honrado
                    </span>
                  </div>
                  
                  {showEpitaphCard && (
                    <button onClick={() => setIsEpitaphModalOpen(true)} className="w-full group rounded-2xl border border-amber-500/40 p-4 bg-[#1A1200]/60 backdrop-blur-md flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all active:scale-[0.98]">
                        <Feather size={16} className="text-amber-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-100">Registrar Legado</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
                  <HoldToConfirmButton 
                    onComplete={() => setIsCheckInModalOpen(true)} 
                  />

                  {isUpcomingEpitaph && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center justify-center gap-2 text-amber-400/90 bg-amber-500/10 py-2 px-5 rounded-full border border-amber-500/20 w-fit"
                    >
                      <Feather size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Epitáfio disponível</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          <motion.section className="w-full mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
                <Zap size={16} className={`transition-colors duration-500 ${isEpitaphBackgroundActive ? 'text-amber-400' : 'text-violet-400'}`} />
                {acceptedMissions.length < 3 ? 'Selecionar Missões' : 'Missões Ativas'}
              </h3>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all duration-500 ${
                isEpitaphBackgroundActive 
                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' 
                  : 'text-violet-300 bg-violet-500/10 border-violet-500/20'
              }`}>
                <span>{acceptedMissions.length}</span>
                <span className="opacity-50">/</span>
                <span>3</span>
              </div>
            </div>

            <div className="relative w-full flex flex-col items-center">
              {acceptedMissions.length < 3 && currentMission ? (
                <MissionSwipeCard mission={currentMission} onSwipe={handleMissionSwipe} />
              ) : (
                <div className={`w-full p-8 rounded-3xl border transition-all duration-500 bg-white/5 flex flex-col items-center text-center backdrop-blur-md ${
                  isEpitaphBackgroundActive ? 'border-amber-500/10' : 'border-white/5'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${isEpitaphBackgroundActive ? 'bg-amber-500' : 'bg-violet-500'}`}>
                    <Check size={24} className={isEpitaphBackgroundActive ? 'text-black' : 'text-white'} />
                  </div>
                  <h4 className="text-base font-bold mb-2 text-white">Arsenal Definido</h4>
                  <p className="text-sm text-gray-400 font-light max-w-[220px]">Suas 3 missões diárias estão prontas. Complete-as abaixo.</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.div className="w-full">
            <div className="mb-4 px-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
                <Sparkles size={16} className={`transition-colors duration-500 ${isEpitaphBackgroundActive ? 'text-amber-400' : 'text-violet-400'}`} />
                Rituais
              </h3>
            </div>
            <DailyHabits profile={profile} refreshTrigger={missionsRefreshKey} />
          </motion.div>

          <motion.div className="mt-8 w-full px-2">
            <button onClick={() => navigate(Routes.SOS)} className="w-full h-16 rounded-2xl relative overflow-hidden group shadow-lg active:scale-[0.98] transition-transform">
              <div className={`absolute inset-0 transition-all duration-1000 ${isEpitaphBackgroundActive ? 'bg-gradient-to-r from-amber-600 to-amber-900 opacity-90' : 'bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 opacity-90'}`} />
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                <Wind className="text-white animate-pulse" size={20} />
                <span className="text-sm font-bold text-white uppercase tracking-widest">Respirar / S.O.S</span>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {showRecoveryModal && profile && (
        <StreakRecoveryModal streakValue={streakNum} onSuccess={handleRecoverySuccess} onFail={handleRecoveryFail} />
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