import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { COLORS, Routes, MASTER_HABITS } from '../types';
import { QUESTIONS } from '../data/assessmentQuestions';
import { ChevronLeft } from 'lucide-react';

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
  
  // Novo estado para seleção de hábitos
  const [showHabitSelection, setShowHabitSelection] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progress = showHabitSelection ? 100 : ((currentIndex + 1) / totalQuestions) * 100;

  /**
   * RECUPERAÇÃO DE PROGRESSO
   */
  useEffect(() => {
    const fetchSavedStep = async () => {
      if (!auth.currentUser) return;
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.last_onboarding_step !== undefined) {
            // Se o passo salvo for maior que o total, vai para hábitos
            if (data.last_onboarding_step >= totalQuestions) {
              setShowHabitSelection(true);
            } else {
              setCurrentIndex(data.last_onboarding_step);
            }
          }
          // Recupera respostas parciais se houver
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

  /**
   * LÓGICA DE VOLTAR (UX Mobile Optimization)
   */
  const handleBack = () => {
    if (showHabitSelection) {
      setShowHabitSelection(false);
      syncStep(totalQuestions - 1);
    } else if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      syncStep(prevIndex);
      // Reset scroll position when going back
      const scrollContainer = document.getElementById('onboarding-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo(0, 0);
    } else {
      // Se estiver na primeira pergunta, volta para a tela de login/anterior
      navigate(-1);
    }
  };

  /**
   * SINCRONIZAÇÃO DE PASSO NO FIRESTORE
   */
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

  /**
   * INTERCEPTAÇÃO DO BOTÃO VOLTAR (History API)
   * Garante que o botão físico/gesto de voltar do celular navegue entre as perguntas
   */
  useEffect(() => {
    // Adiciona uma entrada no histórico sempre que avançar (exceto na primeira pergunta)
    if (currentIndex > 0 || showHabitSelection) {
      window.history.pushState(null, '', window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      // Se o usuário tentar voltar e não estivermos no início, interceptamos
      if (currentIndex > 0 || showHabitSelection) {
        // "Cancela" a saída do histórico empurrando de volta (mantém a rota)
        window.history.pushState(null, '', window.location.href);
        handleBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentIndex, showHabitSelection]);

  const handleSelectOption = (option: any) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: option
    };
    setAnswers(newAnswers);
    // Salva a resposta atual imediatamente
    syncStep(currentIndex, newAnswers);
  };

  const handleToggleHabit = (id: string) => {
    setSelectedHabits(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length < 6) return [...prev, id];
      return prev;
    });
  };

  const handleFinishOnboarding = async () => {
    if (!auth.currentUser) {
      alert("Erro Crítico: Usuário não autenticado.");
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
        selected_habits: selectedHabits, 
        email: auth.currentUser.email,
        onboarding_completed_at: serverTimestamp(),
        last_updated: serverTimestamp(),
        last_onboarding_step: totalQuestions, // Marca como finalizado
        partial_answers: null // Limpa rascunho
      };

      await setDoc(doc(db, "users", auth.currentUser.uid), userProfile, { merge: true });
      
      // Força recarregamento da aplicação para App.tsx detectar o onboarding_completed
      window.location.reload();

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
      setShowHabitSelection(true);
      syncStep(totalQuestions); // Indica que foi para a tela de rituais
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-void">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <Wrapper noPadding hideNavigation>
      <div className="flex flex-col h-[100dvh] w-full bg-transparent overflow-hidden">
        
        {/* Header Fixo: Barra de Progresso + Botão Voltar */}
        <div className="shrink-0 px-6 pt-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={handleBack}
              className="p-1.5 -ml-1 rounded-full active:bg-white/10 transition-colors"
              style={{ color: COLORS.TextSecondary }}
              aria-label="Voltar"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 flex justify-between items-end">
              <span className="text-xs font-bold" style={{ color: COLORS.Primary }}>
                {showHabitSelection ? 'ETAPA FINAL' : `QUESTÃO ${currentIndex + 1}`} 
                {!showHabitSelection && <span style={{ color: COLORS.TextSecondary }}> / {totalQuestions}</span>}
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

        {/* Área de Conteúdo Rolável */}
        <div 
          id="onboarding-scroll-container"
          className="flex-1 overflow-y-auto w-full px-6 scrollbar-hide"
        >
          {!showHabitSelection ? (
            <div className="flex flex-col pt-2 pb-40">
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

              <Button onClick={handleNext} disabled={!currentAnswer}>Próximo</Button>
            </div>
          ) : (
            // TELA DE SELEÇÃO DE HÁBITOS
            <div className="flex flex-col pt-2 pb-40">
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-violet-500">Defina seus Pilares</h2>
                <h1 className="text-2xl font-bold text-white mb-2">Seus Rituais Diários</h1>
                <p className="text-sm text-gray-400">Escolha exatamente 6 atividades que você se compromete a realizar todos os dias.</p>
                <div className="mt-4 flex items-center justify-between bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-lg">
                  <span className="text-xs font-bold text-gray-400">Selecionados</span>
                  <span className={`text-sm font-black ${selectedHabits.length === 6 ? 'text-green-500' : 'text-violet-500'}`}>{selectedHabits.length} / 6</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {MASTER_HABITS.map((habit) => {
                  const isSelected = selectedHabits.includes(habit.id);

                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      disabled={!isSelected && selectedHabits.length === 6}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all duration-200 ${isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-gray-800 bg-gray-900/50 opacity-60'}`}
                    >
                       <div className="flex flex-col gap-1">
                         <span className="text-lg font-bold text-white">{habit.label}</span>
                         <span className="text-base text-white leading-relaxed">{habit.desc}</span>
                       </div>
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={handleFinishOnboarding} 
                disabled={selectedHabits.length !== 6}
                isLoading={isSubmitting}
              >
                Finalizar e Começar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};