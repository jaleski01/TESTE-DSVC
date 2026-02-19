
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';
import { QUESTIONS } from '../data/assessmentQuestions';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Answer {
  score?: number;
  value?: string;
  label: string;
}

interface AnswersState {
  [key: number]: Answer;
}

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    const fetchSavedStep = async () => {
      if (!auth.currentUser) return;
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.last_onboarding_step !== undefined) {
            if (data.last_onboarding_step >= totalQuestions) {
              window.location.href = '/';
            } else {
              setCurrentIndex(data.last_onboarding_step);
            }
          }
          if (data.partial_answers) {
            setAnswers(data.partial_answers);
          }
        }
      } catch (error) {
        console.error("Erro ao recuperar passo salvo:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchSavedStep();
  }, [totalQuestions]);

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      syncStep(prevIndex);
      const scrollContainer = document.getElementById('onboarding-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo(0, 0);
    } else {
      navigate(-1);
    }
  };

  const syncStep = async (step: number, partialAnswers?: AnswersState) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { 
        last_onboarding_step: step,
        partial_answers: partialAnswers || answers,
        last_updated: serverTimestamp() 
      });
    } catch (e) {
      console.warn("Falha ao sincronizar passo:", e);
    }
  };

  useEffect(() => {
    if (currentIndex > 0) {
      window.history.pushState(null, '', window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (currentIndex > 0) {
        window.history.pushState(null, '', window.location.href);
        handleBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentIndex]);

  const handleSelectOption = (option: any) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: option
    };
    setAnswers(newAnswers);
    syncStep(currentIndex, newAnswers);
  };

  const handleFinishOnboarding = async () => {
    if (!auth.currentUser) {
      navigate(Routes.LOGIN);
      return;
    }

    setIsSubmitting(true);

    try {
      let totalScore = 0;
      let victoryMode = 'INDEFINIDO';
      let focusPillar = 'INDEFINIDO';

      Object.entries(answers).forEach(([questionIdStr, val]) => {
        const questionId = parseInt(questionIdStr);
        const answer = val as Answer;
        
        if (questionId <= 15 && answer.score !== undefined) {
          totalScore += answer.score;
        }
        if (questionId === 16 && answer.value) {
          victoryMode = answer.value;
        }
        if (questionId === 17 && answer.value) {
          focusPillar = answer.value;
        }
      });

      const nowISO = new Date().toISOString();
      
      const userProfile = {
        onboarding_completed: true,
        current_streak_start: nowISO,
        victory_mode: victoryMode,
        focus_pillar: focusPillar,
        addiction_score: totalScore,
        email: auth.currentUser.email,
        onboarding_completed_at: serverTimestamp(),
        last_updated: serverTimestamp(),
        last_onboarding_step: totalQuestions,
        partial_answers: null
      };

      await setDoc(doc(db, "users", auth.currentUser.uid), userProfile, { merge: true });
      window.location.href = '/'; 

    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(`Falha ao salvar perfil: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      syncStep(nextIndex);
      const scrollContainer = document.getElementById('onboarding-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo(0, 0);
    } else {
      handleFinishOnboarding();
    }
  };

  if (isInitialLoading) {
    return (
      <div 
        className="h-[100dvh] w-full flex flex-col items-center justify-center text-white"
        style={{ background: 'linear-gradient(to bottom, #000000 0%, #000000 25%, #2E1065 100%)' }}
      >
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <Wrapper noPadding hideNavigation>
      <div className="flex flex-col h-[100dvh] w-full bg-transparent overflow-hidden">
        <div className="shrink-0 px-6 pt-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={handleBack}
              className="p-1.5 -ml-1 rounded-full active:bg-white/10 transition-colors"
              style={{ color: COLORS.TextSecondary }}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 flex justify-between items-end">
              <span className="text-xs font-bold" style={{ color: COLORS.Primary }}>
                QUESTÃO {currentIndex + 1} <span style={{ color: COLORS.TextSecondary }}> / {totalQuestions}</span>
              </span>
              <span className="text-xs" style={{ color: COLORS.TextSecondary }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="w-full h-1 rounded-full bg-[#1C2533]">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, backgroundColor: COLORS.Primary }}
            />
          </div>
        </div>

        <div 
          id="onboarding-scroll-container"
          className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide relative"
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col pt-2 pb-40"
            >
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.Primary }}>
                  {currentQuestion.category}
                </h2>
                <h1 className="text-2xl font-bold leading-tight text-white">
                  {currentQuestion.question}
                </h1>
              </div>

              <div className="flex flex-col space-y-3 mb-8">
                {currentQuestion.options.map((option: any) => {
                  const isSelected = currentAnswer?.label === option.label;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option)}
                      className="w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start group"
                      style={{
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                        borderColor: isSelected ? COLORS.Primary : COLORS.Border,
                      }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-4 shrink-0" style={{ borderColor: isSelected ? COLORS.Primary : COLORS.TextSecondary }}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.Primary }} />}
                      </div>
                      <span className="text-base font-medium" style={{ color: isSelected ? COLORS.TextPrimary : COLORS.TextSecondary }}>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleNext} isLoading={isSubmitting} disabled={!currentAnswer}>
                {currentIndex === totalQuestions - 1 ? 'Finalizar' : 'Próximo'}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Wrapper>
  );
};
