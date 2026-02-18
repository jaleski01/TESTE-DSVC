
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { DailyHabits } from '../components/DailyHabits';
import { ShortcutPrompt } from '../components/ShortcutPrompt';
import { HoldToConfirmButton } from '../components/HoldToConfirmButton';
import { StreakRecoveryModal } from '../components/StreakRecoveryModal';
import { DailyCheckInModal } from '../components/DailyCheckInModal';
import { EpitaphModal } from '../components/EpitaphModal'; 
import { FactSwipeCard } from '../components/FactSwipeCard';
import { OnboardingTour } from '../components/OnboardingTour';
import { COLORS, Routes, UserProfile } from '../types';
import { REALITY_CHECK_DATA, RealityFact } from '../data/realityCheckData';
import { useData } from '../contexts/DataContext';
import { 
  getTodayString, 
  verifyAndResetStreak, 
  restoreStreak,
  forceResetStreak,
  saveRealityCheckResult,
} from '../services/gamificationService';
import { Brain, Sparkles, BookOpen, Check, Feather, Wind, Activity, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile: profile, loading: isLoading, updateLocalProfile, refreshData } = useData();
  
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isEpitaphModalOpen, setIsEpitaphModalOpen] = useState(false); 
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Reality Check State
  const [currentFact, setCurrentFact] = useState<RealityFact | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; fact: RealityFact } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Debug State
  const [debugClicks, setDebugClicks] = useState(0);
  const debugTimerRef = useRef<any>(null);

  const todayStr = getTodayString();
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

  // --- VISUAL GAMIFICATION: GOLDEN HOUR STATE ---
  const isGoldenHour = isEpitaphDay && !hasWrittenToday;

  // Initialize facts
  useEffect(() => {
    if (profile && (profile.daily_fact_count || 0) < 3) {
      const available = REALITY_CHECK_DATA.filter(f => !profile.seen_fact_ids?.includes(f.id));
      const list = available.length > 0 ? available : REALITY_CHECK_DATA;
      setCurrentFact(list[Math.floor(Math.random() * list.length)]);
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
  }, [profile?.uid, profile?.last_fact_date]); 

  // --- DEBUG FUNCTIONALITY ---
  const handleDebugAction = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const today = new Date();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayString = yesterdayDate.toISOString().split('T')[0];

      const newStreak = (profile.currentStreak || 0) + 1;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        currentStreak: newStreak,
        lastCheckInDate: yesterdayString, 
        daily_fact_count: 0 
      });

      updateLocalProfile({
        ...profile,
        currentStreak: newStreak,
        lastCheckInDate: yesterdayString,
        daily_fact_count: 0
      });

      alert(`DEBUG (Zen Mode): Dia avançado para ${newStreak}. Check-in resetado.`);
    } catch (error) {
      console.error("Erro no debug:", error);
    }
  };

  const handleStatusClick = () => {
    setDebugClicks(prev => {
      const newCount = prev + 1;
      if (debugTimerRef.current) clearTimeout(debugTimerRef.current);
      debugTimerRef.current = setTimeout(() => setDebugClicks(0), 2000);

      if (newCount === 3) {
        handleDebugAction();
        return 0;
      }
      return newCount;
    });
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentFact || !auth.currentUser || !profile) return;

    // Haptic Feedback for Reality Check
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    const answer = direction === 'right';
    const isCorrect = answer === currentFact.isTrue;

    setFeedback({ isCorrect, fact: currentFact });
    await saveRealityCheckResult(auth.currentUser.uid, currentFact.id, isCorrect);
    
    const newCount = (profile.daily_fact_count || 0) + 1;
    const newPoints = (profile.reality_check_points || 0) + (isCorrect ? 1 : 0);
    const newSeenIds = [...(profile.seen_fact_ids || []), currentFact.id];
    
    updateLocalProfile({
      daily_fact_count: newCount,
      reality_check_points: newPoints,
      seen_fact_ids: newSeenIds,
      last_fact_date: getTodayString()
    });
  };

  const nextFact = () => {
    setFeedback(null);
    if (profile && (profile.daily_fact_count || 0) < 3) {
      const available = REALITY_CHECK_DATA.filter(f => !profile.seen_fact_ids?.includes(f.id));
      const list = available.length > 0 ? available : REALITY_CHECK_DATA;
      setCurrentFact(list[Math.floor(Math.random() * list.length)]);
    } else {
      setCurrentFact(null);
    }
  };

  const handleRecoverySuccess = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const updatedProfile = await restoreStreak(auth.currentUser.uid, profile);
      updateLocalProfile({
        ...updatedProfile,
        lastCheckInDate: getTodayString() 
      });
      setShowRecoveryModal(false);
      setShowConfetti(true);
    } catch (error) {
      console.error("Erro ao recuperar ofensiva:", error);
    }
  };

  const handleRecoveryFail = async () => {
    if (!profile || !auth.currentUser) return;
    try {
      const updateData = await forceResetStreak(auth.currentUser.uid);
      updateLocalProfile({
        ...updateData,
        currentStreak: 0,
        lastCheckInDate: getTodayString()
      });
      setShowRecoveryModal(false);
    } catch (error) {
      console.error("Erro ao resetar ofensiva:", error);
    }
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
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          </div>
        </div>
        <span className="mt-4 text-xs font-medium tracking-widest text-violet-400/50 uppercase">Carregando Frequência</span>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <Wrapper noPadding hideNavigation={isTourActive} disableDefaultBackground={true}> 
      
      {/* --- DYNAMIC ATMOSPHERE BACKGROUND --- */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isGoldenHour ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[80px]" />
      </div>

      <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isGoldenHour ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-[200px] bg-gradient-to-b from-amber-500/10 to-transparent" />
        <div className="absolute bottom-0 left-[-20%] w-[600px] h-[500px] bg-orange-900/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-full px-5 pt-8 pb-20 flex flex-col items-center">
          
          {/* HEADER: Date & Debug */}
          <header id="tour-timer" className="w-full flex items-center justify-between mb-8 px-1">
            <div className="flex flex-col">
              <span className={`text-xs font-medium transition-colors duration-500 ${isGoldenHour ? 'text-amber-200/60' : 'text-gray-400'}`}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <h1 className={`text-xl font-bold tracking-tight transition-colors duration-500 ${isGoldenHour ? 'text-amber-50 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-white'}`}>
                {isGoldenHour ? 'Dia de Glória' : 'Sua Jornada'}
              </h1>
            </div>
            
            <div 
              onClick={handleStatusClick}
              className={`w-2 h-2 rounded-full cursor-pointer active:scale-150 transition-all ${isGoldenHour ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
            />
          </header>

          {/* HERO: Floating Streak Counter */}
          <motion.section 
            variants={itemVariants}
            className="w-full mb-4 relative flex flex-col items-center justify-center py-6"
          >
            <div className={`absolute inset-0 rounded-full blur-3xl transform scale-75 transition-all duration-1000 ${
              isGoldenHour 
                ? 'bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent opacity-80' 
                : 'bg-gradient-to-b from-violet-500/5 to-transparent'
            }`} />

            <div className="relative z-10 flex flex-col items-center w-full">
              <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 transition-colors duration-500 ${isGoldenHour ? 'text-amber-300' : 'text-violet-300/70'}`}>
                {isGoldenHour ? 'Marco Alcançado' : 'Foco Contínuo'}
              </span>
              
              <div className="flex items-baseline gap-2 mb-10">
                <h2 className={`text-7xl font-light tracking-tighter transition-all duration-700 ${
                  isGoldenHour 
                    ? 'text-amber-100 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]' 
                    : 'text-white drop-shadow-2xl'
                }`}>
                  {profile?.currentStreak || 0}
                </h2>
                <span className={`text-sm font-medium uppercase transition-colors duration-500 ${isGoldenHour ? 'text-amber-200/70' : 'text-violet-200/50'}`}>
                  {(profile?.currentStreak || 0) === 1 ? 'Dia' : 'Dias'}
                </span>
              </div>

              {isCheckedInToday ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-3 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 backdrop-blur-md"
                  >
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Compromisso Honrado</span>
                  </motion.div>
                  
                  {/* Epitaph Action */}
                  {showEpitaphCard && (
                    <motion.button 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEpitaphModalOpen(true)}
                      className="w-full relative overflow-hidden group rounded-2xl border border-amber-500/30 p-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-black opacity-90" />
                      <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-xl py-4 px-6 flex items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                          <Feather size={16} className="text-amber-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-amber-100">
                           {effectiveDay === 0 ? 'Iniciar o Legado' : 'Registrar Legado'}
                        </span>
                      </div>
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-md mx-auto space-y-4">
                  {isGoldenHour ? (
                     <motion.button
                       initial={{ y: 5, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       transition={{ delay: 0.2 }}
                       onClick={() => setIsCheckInModalOpen(true)}
                       className="w-full relative group overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse opacity-20 group-hover:opacity-30 transition-opacity" />
                        
                        <div className="relative m-[1px] bg-black/80 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-amber-500/30">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                              <Crown size={20} className="text-black fill-black/20" />
                           </div>
                           <div className="flex-1 text-left">
                              <h3 className="text-sm font-black text-white uppercase italic tracking-wide">
                                 Dia de Reflexão
                              </h3>
                              <p className="text-[10px] text-amber-200/80 font-medium leading-tight mt-0.5">
                                 Confirme sua vitória e registre seu legado.
                              </p>
                           </div>
                           <div className="text-amber-500">
                              <Feather size={20} />
                           </div>
                        </div>
                     </motion.button>
                  ) : (
                    <HoldToConfirmButton onComplete={() => setIsCheckInModalOpen(true)} />
                  )}
                  
                  {isUpcomingEpitaph && !isGoldenHour && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                      <Feather size={12} className="text-amber-500/80" />
                      <span className="text-[10px] font-medium text-amber-500/80 uppercase tracking-wide">
                        Epitáfio do Dia {currentStreak === 0 ? '0' : currentStreak + 1} Aguardando
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* REALITY CHECK SECTION */}
          <motion.section variants={itemVariants} id="tour-reality" className="w-full mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className={`text-sm font-semibold transition-colors duration-500 flex items-center gap-2 ${isGoldenHour ? 'text-amber-100' : 'text-white/90'}`}>
                <Brain size={16} className={`transition-colors duration-500 ${isGoldenHour ? 'text-amber-400' : 'text-violet-400'}`} />
                Expansão de Consciência
              </h3>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors duration-500 ${
                isGoldenHour 
                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' 
                  : 'text-violet-300 bg-violet-500/10 border-violet-500/20'
              }`}>
                <span>{profile?.daily_fact_count || 0}</span>
                <span className="opacity-50">/</span>
                <span>3</span>
              </div>
            </div>

            <div className="relative w-full flex flex-col items-center">
              {feedback ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full p-8 rounded-3xl border backdrop-blur-xl ${
                    feedback.isCorrect 
                      ? 'bg-emerald-900/10 border-emerald-500/30' 
                      : 'bg-rose-900/10 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {feedback.isCorrect ? <Sparkles size={20} className="text-emerald-400" /> : <Activity size={20} className="text-rose-400" />}
                    <h4 className={`font-bold uppercase tracking-tight text-lg ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {feedback.isCorrect ? 'Visão Clara' : 'Distorção'}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed mb-6 font-light">
                    {feedback.fact.explanation}
                  </p>
                  <div className="flex items-center gap-2 mb-8 opacity-60">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Fonte: {feedback.fact.source}</span>
                  </div>
                  <Button 
                    onClick={nextFact} 
                    className={`border-none ${feedback.isCorrect ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'} text-white shadow-lg`}
                  >
                    Continuar Expansão
                  </Button>
                </motion.div>
              ) : currentFact ? (
                <FactSwipeCard fact={currentFact} onSwipe={handleSwipe} />
              ) : (
                <div className={`w-full p-8 rounded-3xl border flex flex-col items-center text-center backdrop-blur-md transition-colors duration-500 ${
                  isGoldenHour 
                    ? 'border-amber-500/20 bg-amber-900/10' 
                    : 'border-white/5 bg-white/5'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-lg transition-all duration-500 ${
                    isGoldenHour 
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/20' 
                      : 'bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-violet-500/20'
                  }`}>
                    <Check size={24} className="text-white" />
                  </div>
                  <h4 className={`text-base font-bold mb-2 transition-colors duration-500 ${isGoldenHour ? 'text-amber-100' : 'text-white'}`}>Consciência Elevada</h4>
                  <p className="text-sm text-gray-400 font-light max-w-[220px]">
                    Sessão diária concluída. Retorne amanhã para novos insights.
                  </p>
                </div>
              )}

              {/* Liquid Progress Bar (Organic Pulse) */}
              <div className="w-full mt-8 px-2">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nível de Clareza</span>
                  <span className={`text-[10px] font-mono transition-colors duration-500 ${isGoldenHour ? 'text-amber-300' : 'text-cyan-300'}`}>{(profile?.reality_check_points || 0)}/30 pts</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(((profile?.reality_check_points || 0) / 30) * 100, 100)}%`,
                      opacity: [0.8, 1, 0.8] 
                    }}
                    transition={{
                      opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    }}
                    className={`h-full rounded-full shadow-lg transition-all duration-1000 relative overflow-hidden ${
                      isGoldenHour 
                        ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                        : 'bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-400 shadow-[0_0_15px_rgba(167,139,250,0.5)]'
                    }`}
                  >
                    {/* Energy Flow Effect */}
                    <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* HABITS SECTION */}
          <motion.div variants={itemVariants} id="tour-streak" className="w-full">
            <div className="mb-4 px-2">
              <h3 className={`text-sm font-semibold transition-colors duration-500 flex items-center gap-2 ${isGoldenHour ? 'text-amber-100' : 'text-white/90'}`}>
                <Sparkles size={16} className={`transition-colors duration-500 ${isGoldenHour ? 'text-amber-400' : 'text-violet-400'}`} />
                Rituais
              </h3>
            </div>
            <DailyHabits profile={profile} />
          </motion.div>

          {/* ZEN SOS BUTTON */}
          <motion.div variants={itemVariants} className="mt-12 w-full px-2">
            <button 
              onClick={() => navigate(Routes.SOS)}
              className="w-full h-16 rounded-2xl relative overflow-hidden group shadow-lg shadow-orange-500/10 active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 via-rose-500/80 to-purple-600/80 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
              
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                <Wind className="text-white animate-pulse" size={20} />
                <span className="text-sm font-bold text-white uppercase tracking-widest">
                  Respirar / S.O.S
                </span>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>

      <OnboardingTour isReady={!isLoading} onTourStateChange={setIsTourActive} />

      {showRecoveryModal && profile && (
        <StreakRecoveryModal streakValue={profile.currentStreak || 0} onSuccess={handleRecoverySuccess} onFail={handleRecoveryFail} />
      )}

      {isCheckInModalOpen && profile && (
        <DailyCheckInModal 
          profile={profile} 
          isEpitaphDay={isEpitaphDay}
          hasWrittenEpitaphToday={hasWrittenToday}
          onClose={() => setIsCheckInModalOpen(false)} 
          onSuccess={handleCheckInSuccess} 
        />
      )}

      {isEpitaphModalOpen && profile && (
        <EpitaphModal 
          dayNumber={effectiveDay} 
          onClose={() => setIsEpitaphModalOpen(false)} 
          onSuccess={handleEpitaphSuccess} 
        />
      )}

      <ShortcutPrompt />
    </Wrapper>
  );
};
