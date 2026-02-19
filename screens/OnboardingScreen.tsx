
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes } from '../types';
import { QUESTIONS } from '../data/assessmentQuestions';
import { ChevronLeft, Brain, TrendingUp, AlertTriangle, Clock, Zap, ShieldCheck } from 'lucide-react';
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

  // --- CÁLCULO DAS MÉTRICAS DE CHOQUE ---
  const reportMetrics = useMemo(() => {
    if (!showReport) return null;

    let totalScore = 0;
    let timeLostValue = "7h";

    // Casting explícito para evitar erros de tipo no loop
    (Object.entries(answers) as [string, Answer][]).forEach(([idStr, answer]) => {
      const id = parseInt(idStr);
      // Questões de 1 a 15 compõem o score de vício
      if (id <= 15 && answer.score !== undefined) {
        totalScore += answer.score;
      }
      
      // Métrica de Tempo Perdido baseada na Pergunta 1
      if (id === 1 && answer.score !== undefined) {
        if (answer.score === 0) timeLostValue = "7 horas";
        else if (answer.score === 1) timeLostValue = "22 horas";
        else if (answer.score === 3) timeLostValue = "60 horas";
        else if (answer.score === 5) timeLostValue = "120 horas";
      }
    });

    // Severidade: (totalScore / 30) * 100, limitado a 99%
    const severityPercent = Math.min(99, Math.round((totalScore / 30) * 100));
    
    // Dias para Reboot: 45 + score * 1.5, mínimo de 90
    const rebootDays = Math.max(90, Math.round(45 + totalScore * 1.5));

    return { totalScore, timeLostValue, severityPercent, rebootDays };
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
        victory_mode: answers[16]?.value || 'INDEFINIDO',
        focus_pillar: answers[17]?.value || 'INDEFINIDO',
        addiction_score: reportMetrics.totalScore,
        reboot_projection_days: reportMetrics.rebootDays,
        severity_index: reportMetrics.severityPercent,
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

  if (isInitialLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center text-white bg-black">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <Wrapper noPadding hideNavigation disableDefaultBackground>
      <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden relative">
        
        {/* Unified Atmosphere Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[80px]" />
        </div>

        <AnimatePresence mode="wait">
          {!showReport ? (
            <motion.div 
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full w-full relative z-10"
            >
              {/* Progress Header */}
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
                  />
                </div>
              </div>

              {/* Question Content */}
              <div 
                id="onboarding-scroll-container"
                className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide pb-32"
              >
                <motion.div 
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
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

                  <div className="flex flex-col space-y-3">
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
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <Button onClick={handleNext} disabled={!currentAnswer}>
                  {currentIndex === totalQuestions - 1 ? 'Gerar Análise' : 'Próxima Questão'}
                </Button>
              </div>
            </motion.div>
          ) : (
            // --- RELATÓRIO DE CHOQUE E EVOLUÇÃO ---
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full w-full relative z-10 overflow-y-auto scrollbar-hide px-6 pt-12 pb-40"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                  <Brain size={32} className="text-violet-500" />
                </div>
              </div>

              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center mb-10">
                Análise Concluída.<br/>A verdade sobre o seu cérebro:
              </h1>

              {/* Shock Metrics Grid */}
              <div className="grid grid-cols-1 gap-4 mb-12">
                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center gap-4">
                  <Clock className="text-red-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-xl font-black text-white italic leading-none">{reportMetrics?.timeLostValue} / mês</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Estimativa de tempo incinerado no vício.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-orange-950/20 border border-orange-500/20 flex items-center gap-4">
                  <AlertTriangle className="text-orange-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-xl font-black text-white italic leading-none">{reportMetrics?.severityPercent}%</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Mais dependente de dopamina artificial que a média.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-violet-950/20 border border-violet-500/20 flex items-center gap-4">
                  <Zap className="text-violet-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-xl font-black text-white italic leading-none">{reportMetrics?.rebootDays} dias</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Protocolo estrito para regeneração dos recetores.</p>
                  </div>
                </div>
              </div>

              {/* Evolution Chart */}
              <div className="w-full bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 mb-12">
                <div className="flex items-center gap-2 mb-8">
                  <TrendingUp size={16} className="text-violet-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Projeção de Recuperação Neural</h4>
                </div>

                <div className="flex items-end justify-between gap-4 h-40 relative">
                  {[
                    { label: 'Hoje', h: Math.max(15, (reportMetrics?.totalScore || 0) * 1.5), color: '#EF4444', desc: 'Vício' },
                    { label: 'D30', h: 45, color: '#EAB308', desc: 'Clareza' },
                    { label: 'D45', h: 70, color: '#10B981', desc: 'Controlo' },
                    { label: 'D90', h: 100, color: '#8B5CF6', desc: 'Reboot' }
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full h-full relative flex items-end justify-center">
                        <motion.div 
                          className="w-8 sm:w-10 rounded-t-lg relative"
                          style={{ backgroundColor: bar.color }}
                          initial={{ height: 0 }}
                          animate={{ height: `${bar.h}%` }}
                          transition={{ delay: 0.5 + (i * 0.2), duration: 1, ease: "easeOut" }}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-50 rounded-t-lg" />
                        </motion.div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-white">{bar.label}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{bar.desc}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Grid Lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
                </div>
              </div>

              {/* Conclusion Quote */}
              <div className="px-4 text-center">
                <p className="text-sm text-gray-400 italic leading-relaxed">
                  "O vício é o roubo da sua liberdade em parcelas diárias. O protocolo não é uma punição, é o resgate do homem que você deveria ser."
                </p>
              </div>

              {/* Sticky Footer CTA */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Button 
                    onClick={handleFinishOnboarding} 
                    isLoading={isSubmitting}
                    className="h-16 text-lg font-black uppercase tracking-widest bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                  >
                    ACEITAR O DESAFIO DE {reportMetrics?.rebootDays} DIAS
                  </Button>
                </motion.div>
                <button 
                  onClick={() => setShowReport(false)}
                  className="w-full text-center mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Rever Diagnóstico
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Wrapper>
  );
};
