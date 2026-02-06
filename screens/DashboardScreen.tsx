import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { StreakTimer } from '../components/StreakTimer';
import { DailyHabits } from '../components/DailyHabits';
import { TriggerModal } from '../components/TriggerModal';
import { ShortcutPrompt } from '../components/ShortcutPrompt';
import { HoldToConfirmButton } from '../components/HoldToConfirmButton';
import { StreakRecoveryModal } from '../components/StreakRecoveryModal';
import { DailyCheckInModal } from '../components/DailyCheckInModal';
import { COLORS, Routes, UserProfile } from '../types';
import { 
  getTodayString, 
  verifyAndResetStreak, 
  restoreStreak,
  forceResetStreak,
  ACHIEVEMENTS 
} from '../services/gamificationService';

const CACHE_KEY = 'user_profile';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<any>(null);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        let data = docSnap.data() as UserProfile;
        const result = await verifyAndResetStreak(uid, data);
        if (result.streakStatus === 'NEEDS_RECOVERY') setShowRecoveryModal(true);
        setProfile(result);
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } else {
        navigate(Routes.ONBOARDING);
      }
    } catch (error) {
      console.error("Dashboard profile load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadProfile(user.uid);
        const handleFocus = () => auth.currentUser && loadProfile(auth.currentUser.uid);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
      }
      else navigate(Routes.LOGIN);
    });
    return () => unsubscribe();
  }, [loadProfile, navigate]);

  const handleRecoverySuccess = async () => {
    if (!profile || !auth.currentUser) return;
    const updatedProfile = await restoreStreak(auth.currentUser.uid, profile);
    setProfile(updatedProfile);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfile));
    setShowRecoveryModal(false);
  };

  const handleRecoveryFail = async () => {
    if (!profile || !auth.currentUser) return;
    const updateData = await forceResetStreak(auth.currentUser.uid);
    const newProfile = { ...profile, ...updateData };
    setProfile(newProfile);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newProfile));
    setShowRecoveryModal(false);
  };

  const handleCheckInSuccess = (updatedProfile: UserProfile) => {
    // Só mostramos confetes se o streak atual for maior que o anterior e não for reset
    if (updatedProfile.currentStreak && updatedProfile.currentStreak > (profile?.currentStreak || 0)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    setProfile(updatedProfile);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfile));
  };

  const nextMilestone = useMemo(() => {
    if (!profile) return null;
    const current = profile.currentStreak || 0;
    const next = ACHIEVEMENTS.find(ach => ach.days > current);
    if (!next) return null;
    return { ...next, progress: (current / next.days) * 100 };
  }, [profile]);

  const isCheckedInToday = profile?.lastCheckInDate === getTodayString();

  if (isLoading) {
    return (
      <div className="flex-1 h-[100dvh] w-full flex flex-col items-center justify-center bg-transparent">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: COLORS.Primary, borderTopColor: 'transparent' }} />
        <span className="text-[10px] font-bold tracking-[0.3em] opacity-30 uppercase" style={{ color: COLORS.TextSecondary }}>Protocolo</span>
      </div>
    );
  }

  return (
    <Wrapper noPadding> 
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-transparent">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="absolute top-[-10px] w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [COLORS.Primary, COLORS.Cyan, COLORS.Success, '#FBBF24'][i % 4],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        <div className="w-full max-w-full px-5 pt-8 pb-32 flex flex-col items-center">
          <header className="flex flex-col w-full mb-6">
            <div className="flex items-center gap-2 mb-2 w-fit">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
               <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: COLORS.TextSecondary }}>Status: Operante</span>
            </div>
            <StreakTimer startDate={profile?.current_streak_start} />
          </header>

          <section className="w-full mb-6 p-6 rounded-2xl bg-[#0F0A15] border border-[#2E243D] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 duration-500">
              <svg className={`w-24 h-24 ${isCheckedInToday ? 'text-orange-500' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.5c-4.1 0-7.5-3.4-7.5-7.5 0-3.5 2.1-6.1 4.5-8.5.6-.6 1.3-1.2 1.8-1.9.4-.5.7-1.1.9-1.8.1-.3.5-.4.8-.2.5.4 1 1.2 1.1 2.1.1.8-.1 1.6-.5 2.3-.3.4-.6.8-.9 1.2-1.8 2.3-3.2 4.1-3.2 6.7 0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8c0-1.8-.9-3.7-2.6-5.3-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 2 1.8 3.1 4.1 3.1 6.1 0 4.1-3.4 7.5-7.5 7.5zM12 18.5c-2.4 0-4.3-1.9-4.3-4.3 0-2.4 1.9-4.3 4.3-4.3s4.3 1.9 4.3 4.3c0 2.4-1.9 4.3-4.3 4.3z"/>
              </svg>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">Ofensiva Atual</span>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className={`text-5xl font-black ${isCheckedInToday ? 'text-white' : 'text-gray-700'}`}>
                  {profile?.currentStreak || 0}
                </h2>
                <span className="text-sm font-bold text-gray-500">DIAS</span>
              </div>

              {isCheckedInToday ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-bold text-green-500 uppercase">Vitória Registrada</span>
                  </div>
                  {nextMilestone && (
                    <div className="w-full">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Próximo Marco: {nextMilestone.days} Dias</span>
                        <span className="text-[10px] font-mono text-violet-400">{Math.round(nextMilestone.progress)}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${nextMilestone.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <HoldToConfirmButton label="Reivindicar Vitória de Hoje" onComplete={() => setIsCheckInModalOpen(true)} />
              )}
            </div>
          </section>

          <div className="w-full mb-8">
            <Button 
              variant="outline" 
              onClick={() => setIsTriggerModalOpen(true)} 
              className="flex items-center justify-center gap-2 w-full active:bg-red-500/5" 
              style={{ borderColor: '#FF3333', borderStyle: 'dashed', borderWidth: '1px', color: COLORS.Primary }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Registrar Gatilho
            </Button>
          </div>

          <div className="mt-2 mb-4 w-full"><h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Rituais de Poder</h3></div>
          <DailyHabits profile={profile} />

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

      {showRecoveryModal && profile && (
        <StreakRecoveryModal streakValue={profile.currentStreak || 0} onSuccess={handleRecoverySuccess} onFail={handleRecoveryFail} />
      )}

      {isCheckInModalOpen && profile && (
        <DailyCheckInModal profile={profile} onClose={() => setIsCheckInModalOpen(false)} onSuccess={handleCheckInSuccess} />
      )}

      {isTriggerModalOpen && <TriggerModal onClose={() => setIsTriggerModalOpen(false)} />}
      <ShortcutPrompt />
    </Wrapper>
  );
};