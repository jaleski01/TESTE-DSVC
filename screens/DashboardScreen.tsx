
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { StreakTimer } from '../components/StreakTimer';
import { DailyHabits } from '../components/DailyHabits';
import { ShortcutPrompt } from '../components/ShortcutPrompt';
import { HoldToConfirmButton } from '../components/HoldToConfirmButton';
import { StreakRecoveryModal } from '../components/StreakRecoveryModal';
import { DailyCheckInModal } from '../components/DailyCheckInModal';
import { EpitaphModal } from '../components/EpitaphModal'; // NEW
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
import { Brain, AlertCircle, Sparkles, BookOpen, Check, Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile: profile, loading: isLoading, updateLocalProfile, refreshData } = useData();
  
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isEpitaphModalOpen, setIsEpitaphModalOpen] = useState(false); // NEW
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Reality Check State
  const [currentFact, setCurrentFact] = useState<RealityFact | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; fact: RealityFact } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const todayStr = getTodayString();
  const streak = profile?.currentStreak || 0;

  // Lógica do Epitáfio (Arquitetura UX):
  // 1. Dia 0 (Reset/Início): O usuário DEVE escrever para marcar o novo começo.
  // 2. Dias 7, 14, 21... (Múltiplos de 7): Marcos de evolução.
  // 3. O usuário ainda não deve ter escrito hoje (last_epitaph_date !== todayStr).
  const isEpitaphDay = streak === 0 || (streak > 0 && streak % 7 === 0);
  
  const hasWrittenEpitaph = profile?.last_epitaph_date === todayStr;
  const showEpitaphCard = isEpitaphDay && !hasWrittenEpitaph;

  // Initialize facts of the day when profile is available
  useEffect(() => {
    if (profile && (profile.daily_fact_count || 0) < 3) {
      const available = REALITY_CHECK_DATA.filter(f => !profile.seen_fact_ids?.includes(f.id));
      const list = available.length > 0 ? available : REALITY_CHECK_DATA;
      setCurrentFact(list[Math.floor(Math.random() * list.length)]);
    }

    // Check streak status only once when profile loaded
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

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentFact || !auth.currentUser || !profile) return;

    const answer = direction === 'right'; // Right = Verdade, Left = Mito
    const isCorrect = answer === currentFact.isTrue;

    setFeedback({ isCorrect, fact: currentFact });

    // Save result to Firebase
    await saveRealityCheckResult(auth.currentUser.uid, currentFact.id, isCorrect);
    
    // Update local state immediately for UX
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
      
      // Força a UI a reconhecer que hoje está pago e a streak está salva para evitar frustração
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
      
      // Força a UI para o Dia 0 (que é dia de Epitáfio) e marca como check-in feito
      // Isso garante que o botão "Escrever o Começo" apareça imediatamente
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
    // Atualiza localmente para remover o card imediatamente
    updateLocalProfile({ last_epitaph_date: getTodayString() });
  };

  const isCheckedInToday = profile?.lastCheckInDate === getTodayString();

  if (isLoading && !profile) {
    return (
      <div className="flex-1 h-[100dvh] w-full flex flex-col items-center justify-center bg-transparent">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: COLORS.Primary, borderTopColor: 'transparent' }} />
        <span className="text-[10px] font-bold tracking-[0.3em] opacity-30 uppercase" style={{ color: COLORS.TextSecondary }}>Protocolo</span>
      </div>
    );
  }

  return (
    <Wrapper noPadding hideNavigation={isTourActive}> 
      <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-transparent">
        <div className="w-full max-w-full px-5 pt-8 pb-32 flex flex-col items-center">
          
          <header id="tour-timer" className="flex flex-col w-full mb-6">
            <div className="flex items-center gap-2 mb-2 w-fit">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
               <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: COLORS.TextSecondary }}>Status: Operante</span>
            </div>
            <StreakTimer startDate={profile?.current_streak_start || new Date().toISOString()} />
          </header>

          <section className="w-full mb-8 p-6 rounded-2xl bg-[#0F0A15] border border-[#2E243D] relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">Ofensiva Atual</span>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className={`text-5xl font-black ${isCheckedInToday ? 'text-white' : 'text-gray-700'}`}>
                  {profile?.currentStreak || 0}
                </h2>
                <span className="text-sm font-bold text-gray-500 uppercase">
                  {(profile?.currentStreak || 0) === 1 ? 'DIA' : 'DIAS'}
                </span>
              </div>

              {isCheckedInToday ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span className="text-xs font-bold text-green-500 uppercase">Vitória Registrada</span>
                  </div>
                  
                  {/* CARD EPITÁFIO (SÓ APARECE SE JÁ FEZ CHECKIN E É O DIA CERTO) */}
                  {showEpitaphCard && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <button 
                        onClick={() => setIsEpitaphModalOpen(true)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all border border-amber-400/20"
                      >
                         <Feather size={18} className="text-black" strokeWidth={2.5} />
                         <span className="text-xs font-black text-black uppercase tracking-widest">
                            {streak === 0 ? 'Escrever o Começo' : 'Escrever Epitáfio'}
                         </span>
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <HoldToConfirmButton label="Reivindicar Vitória de Hoje" onComplete={() => setIsCheckInModalOpen(true)} />
              )}
            </div>
          </section>

          {/* REALITY CHECK SECTION */}
          <section id="tour-reality" className="w-full mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
                <Brain size={14} className="text-violet-500" />
                Reality Check Diário
              </h3>
              <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                {profile?.daily_fact_count || 0}/3
              </span>
            </div>

            <div className="relative w-full flex flex-col items-center">
              {feedback ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-full p-6 rounded-3xl border ${feedback.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    {feedback.isCorrect ? <Sparkles size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
                    <h4 className={`font-black uppercase tracking-tighter text-lg ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {feedback.isCorrect ? 'CORRETO!' : 'ERROU...'}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {feedback.fact.explanation}
                  </p>
                  <div className="flex items-center gap-2 mb-6 opacity-40">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase italic">Fonte: {feedback.fact.source}</span>
                  </div>
                  <Button onClick={nextFact} className={feedback.isCorrect ? 'bg-green-600' : 'bg-red-600'}>
                    Próximo
                  </Button>
                </motion.div>
              ) : currentFact ? (
                <FactSwipeCard fact={currentFact} onSwipe={handleSwipe} />
              ) : (
                <div className="w-full p-8 rounded-3xl border border-dashed border-gray-800 bg-[#0A0A0A]/50 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                    <Check size={24} className="text-violet-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Dose de Realidade Completa</h4>
                  <p className="text-xs text-gray-500 max-w-[200px]">
                    Sua consciência foi blindada por hoje. Volte amanhã para mais dados táticos.
                  </p>
                </div>
              )}

              {/* Consciousness Level Progress Bar */}
              <div className="w-full mt-6 px-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nível de Consciência</span>
                  <span className="text-[10px] font-mono text-violet-400">{(profile?.reality_check_points || 0)}/30</span>
                </div>
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((profile?.reality_check_points || 0) / 30) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  />
                </div>
              </div>
            </div>
          </section>

          <div id="tour-streak" className="w-full">
            <div className="mt-2 mb-4 w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500" />
                Rituais de Poder
              </h3>
            </div>
            <DailyHabits profile={profile} />
          </div>

          <div className="mt-10 w-full">
            <Button 
              variant="danger" 
              className="h-16 text-lg tracking-widest shadow-[0_0_35px_rgba(255,23,68,0.4)] active:scale-95 border-t border-white/10" 
              onClick={() => navigate(Routes.SOS)}
            >
              S.O.S EMERGÊNCIA
            </Button>
          </div>
        </div>
      </div>

      <OnboardingTour isReady={!isLoading} onTourStateChange={setIsTourActive} />

      {showRecoveryModal && profile && (
        <StreakRecoveryModal streakValue={profile.currentStreak || 0} onSuccess={handleRecoverySuccess} onFail={handleRecoveryFail} />
      )}

      {isCheckInModalOpen && profile && (
        <DailyCheckInModal profile={profile} onClose={() => setIsCheckInModalOpen(false)} onSuccess={handleCheckInSuccess} />
      )}

      {/* MODAL DO EPITÁFIO */}
      {isEpitaphModalOpen && profile && (
        <EpitaphModal 
          dayNumber={streak} 
          onClose={() => setIsEpitaphModalOpen(false)} 
          onSuccess={handleEpitaphSuccess} 
        />
      )}

      <ShortcutPrompt />
    </Wrapper>
  );
};
