
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';
import { QUESTIONS } from '../data/assessmentQuestions';
import { ChevronLeft, Brain, TrendingUp, AlertTriangle, Clock, ShieldCheck, Zap } from 'lucide-react';
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
  const [showReport, setShowReport] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // --- REPORT CALCULATIONS ---
  const reportMetrics = useMemo(() => {
    if (!showReport) return null;

    let totalScore = 0;
    let timeLostValue = "7 horas";
    let victoryMode = 'INDEFINIDO';
    let focusPillar = 'INDEFINIDO';

    (Object.entries(answers) as [string, Answer][]).forEach(([idStr, answer]) => {
      const id = parseInt(idStr);
      if (id <= 15 && answer.score !== undefined) totalScore += answer.score;
      if (id === 1 && answer.score !== undefined) {
        if (answer.score === 0) timeLostValue = "7 horas";
        else if (answer.score === 1) timeLostValue = "22 horas";
        else if (answer.score === 3) timeLostValue = "60 horas";
        else if (answer.score === 5) timeLostValue = "120 horas";
      }
      if (id === 16) victoryMode = answer.value || 'INDEFINIDO';
      if (id === 17) focusPillar = answer.value || 'INDEFINIDO';
    });

    // Severidade % (Max score is 15 questions * 5 = 75)
    const severityPercent = Math.min(99, Math.round((totalScore / 75) * 100));
    
    // CORREÇÃO DA MATEMÁTICA: Escala entre 45 e 90 dias baseada no score (max 75)
    const calculatedDays = Math.round(45 + (totalScore / 75) * 45);
    const rebootDays = Math.min(90, Math.max(45, calculatedDays));

    return { totalScore, timeLostValue, severityPercent, rebootDays, victoryMode, focusPillar };
  }, [showReport, answers]);

  useEffect(() => {
    const fetchSavedStep = async () => {
      if (!auth.currentUser) return;
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.onboarding_completed) {
            window.location.href = '/';
            return;
          }
          if (data.last_onboarding_step !== undefined) {
            setCurrentIndex(Math.min(data.last_onboarding_step, totalQuestions - 1));
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

  const handleBack = () => {
    if (showReport) {
      setShowReport(false);
      return;
    }
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      syncStep(prevIndex);
    } else {
      navigate(-1);
    }
  };

  const handleSelectOption = (option: any) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: option
    };
    setAnswers(newAnswers);
    syncStep(currentIndex, newAnswers);
  };

  const handleFinishOnboarding = async () => {
    if (!auth.currentUser || !reportMetrics) {
      navigate(Routes.LOGIN);
      return;
    }

    setIsSubmitting(true);

    try {
      const nowISO = new Date().toISOString();
      const userProfile = {
        onboarding_completed: true,
        current_streak_start: nowISO,
        victory_mode: reportMetrics.victoryMode,
        focus_pillar: reportMetrics.focusPillar,
        addiction_score: reportMetrics.totalScore,
        reboot_projection_days: reportMetrics.rebootDays,
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
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowReport(true);
    }
  };

  if (isInitialLoading) {
    return (
      <div 
        className="h-[100dvh] w-full flex flex-col items-center justify-center text-white bg-black"
      >
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <Wrapper noPadding hideNavigation disableDefaultBackground>
      <div className="flex flex-col flex-1 w-full bg-black overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!showReport ? (
            <motion.div 
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-full w-full relative z-10"
            >
              <div className="shrink-0 px-6 pt-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <button 
                    onClick={handleBack}
                    className="p-1.5 -ml-1 rounded-full active:bg-white/10 transition-colors text-gray-400"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex-1 flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-violet-500">
                      PROTOCOLO <span className="text-gray-500"> {currentIndex + 1} / {totalQuestions}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1 rounded-full bg-white/5">
                  <motion.div 
                    className="h-full rounded-full bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div 
                id="onboarding-scroll-container"
                className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide pb-32"
              >
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col pt-4"
                  >
                    <div className="mb-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500 mb-2 block">
                        {currentQuestion.category}
                      </span>
                      <h1 className="text-2xl font-bold leading-tight text-white italic">
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
                            className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                              isSelected 
                                ? 'bg-violet-600/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                                : 'bg-[#0F0A15]/60 border-[#2E243D] hover:border-violet-500/30'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${isSelected ? 'border-violet-500' : 'border-gray-700'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                            </div>
                            <span className={`text-base font-semibold leading-snug ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <Button onClick={handleNext} disabled={!currentAnswer} className="shadow-lg shadow-violet-900/20">
                  {currentIndex === totalQuestions - 1 ? 'Gerar Análise' : 'Próxima Questão'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col flex-1 w-full relative z-10 overflow-y-auto scrollbar-hide px-6 pt-12 pb-12"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.3)]">
                  <Brain size={32} className="text-violet-500" />
                </div>
              </div>

              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center mb-2">
                Diagnóstico Concluído
              </h1>
              <p className="text-center text-gray-500 text-sm font-bold uppercase tracking-widest mb-10">
                A verdade sobre seu cérebro e seu tempo
              </p>

              <div className="grid grid-cols-1 gap-4 mb-10">
                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Clock className="text-red-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Tempo Perdido / Mês</span>
                    <h3 className="text-2xl font-black text-white italic">{reportMetrics?.timeLostValue}</h3>
                    <p className="text-[10px] text-gray-500 leading-tight">Você está incinerando seu recurso mais valioso.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-orange-950/20 border border-orange-500/20 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Dependência Dopaminérgica</span>
                    <h3 className="text-2xl font-black text-white italic">{reportMetrics?.severityPercent}%</h3>
                    <p className="text-[10px] text-gray-500 leading-tight">Acima da média da população saudável.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-violet-950/20 border border-violet-500/20 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Zap className="text-violet-500" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-violet-500 tracking-widest">Protocolo de Reboot</span>
                    <h3 className="text-2xl font-black text-white italic">{reportMetrics?.rebootDays} DIAS</h3>
                    <p className="text-[10px] text-gray-500 leading-tight">Tempo estimado para regeneração neural completa.</p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 mb-12">
                <div className="flex items-center gap-2 mb-8">
                  <TrendingUp size={16} className="text-violet-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Projeção de Recuperação Neural</h4>
                </div>

                <div className="flex items-end justify-between gap-3 h-[160px] relative mt-4 border-b border-[#2E243D] pb-2">
                  {[
                    { day: 'Dia 0', label: 'Hoje', h: 15 },
                    { day: 'Dia 30', label: 'Brain Fog', h: 45 },
                    { day: 'Dia 45', label: 'Controle', h: 70 },
                    { day: 'Dia 90', label: 'Reboot', h: 100 }
                  ].map((bar, i) => (
                    <div key={bar.day} className="flex flex-col items-center gap-2 group z-10 h-full justify-end flex-1">
                      <div className="relative flex items-end h-full w-full justify-center px-1">
                        {/* Fundo Padrão (Track Escuro) da barra */}
                        <div className="absolute bottom-0 w-full max-w-[28px] bg-[#1F2937] rounded-t-sm h-full"></div>
                        
                        {/* Barra Preenchida Monocromática e Linear */}
                        <motion.div 
                          initial={{ height: "4px" }}
                          animate={{ height: `${bar.h}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 + i * 0.15 }}
                          className="w-full max-w-[28px] rounded-t-sm relative z-10"
                          style={{ backgroundColor: '#8B5CF6', minHeight: '4px' }}
                        >
                          {bar.h === 100 && (
                            <div className="absolute inset-0 bg-[#8B5CF6] blur-[6px] opacity-40"></div>
                          )}
                        </motion.div>
                      </div>
                      <div className="flex flex-col items-center pb-1">
                        <span className="text-[9px] font-bold text-gray-400">{bar.label}</span>
                        <span className="text-[8px] font-black uppercase text-gray-600 mt-0.5">{bar.day}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 text-center mb-12">
                <p className="text-sm text-gray-400 italic leading-relaxed">
                  "O vício é o roubo da sua liberdade em parcelas diárias. O protocolo não é uma punição, é o resgate do homem que você deveria ser."
                </p>
              </div>

              {/* Scrollable Final CTA */}
              <div className="w-full mt-10 mb-8 flex flex-col gap-4 relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Button 
                    onClick={handleFinishOnboarding} 
                    isLoading={isSubmitting}
                    className="h-16 text-lg font-black uppercase tracking-widest bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.4)] w-full"
                  >
                    INICIAR DESAFIO
                  </Button>
                </motion.div>
                <button 
                  onClick={() => setShowReport(false)}
                  className="w-full text-center mt-2 pb-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Revisar Diagnóstico
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Wrapper>
  );
};
