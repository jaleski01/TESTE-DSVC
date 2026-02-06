import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomRecoverySet, RecoveryQuestion } from '../data/recoveryQuestions';
import { Button } from './Button';
import { COLORS } from '../types';

interface StreakRecoveryModalProps {
  streakValue: number;
  onSuccess: () => void;
  onFail: () => void;
}

export const StreakRecoveryModal: React.FC<StreakRecoveryModalProps> = ({ 
  streakValue, 
  onSuccess, 
  onFail 
}) => {
  const [questions] = useState<RecoveryQuestion[]>(() => getRandomRecoverySet(3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  
  // Educational feedback states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    const correct = index === currentQuestion.correctIndex;
    setWasCorrect(correct);

    if (navigator.vibrate) {
      navigator.vibrate(correct ? 50 : [100, 50, 100]);
    }

    // Auto-advance only if correct
    if (correct) {
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
          setWasCorrect(null);
        } else {
          setGameState('SUCCESS');
        }
      }, 1500);
    }
  };

  const handleAcceptFailure = () => {
    setGameState('FAILED');
  };

  // Renderização via Portal para escapar de Stacking Contexts restritivos
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl overflow-y-auto overflow-x-hidden touch-none sm:touch-auto">
      {/* Container de Scroll e Centralização */}
      <div className="min-h-full w-full flex items-center justify-center p-6 relative">
        
        {/* Efeito de Fundo Global (Fixed Background no Portal) */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.15)_0%,_transparent_70%)] pointer-events-none" />
        
        <div className="w-full max-w-sm relative z-10 py-10">
          <AnimatePresence mode="wait">
            {gameState === 'IDLE' && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full text-center"
              >
                <div className="w-20 h-20 bg-red-600/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">Ofensiva em Risco</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Você falhou ontem. Sua marca de <strong className="text-white">{streakValue} dias</strong> será resetada a menos que você passe no teste biológico.
                </p>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-8">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Protocolo de Emergência</p>
                  <p className="text-xs text-gray-300 mt-1">Acerte 3 perguntas sobre o cérebro. Um erro e o sistema é limpo.</p>
                </div>
                <Button variant="danger" onClick={() => setGameState('PLAYING')}>Iniciar Recuperação</Button>
              </motion.div>
            )}

            {gameState === 'PLAYING' && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full"
              >
                <div className="mb-6">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Desafio {currentIndex + 1}/3</span>
                  <h2 className="text-xl font-bold text-white leading-tight mt-1">{currentQuestion.question}</h2>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;
                    
                    let borderColor = COLORS.Border;
                    let bgColor = '#0F0A15';
                    let opacity = '1';

                    if (isAnswered) {
                      if (isCorrect) {
                        borderColor = '#10B981';
                        bgColor = 'rgba(16, 185, 129, 0.1)';
                      } else if (isSelected) {
                        borderColor = '#EF4444';
                        bgColor = 'rgba(239, 68, 68, 0.1)';
                      } else {
                        opacity = '0.3';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={isAnswered}
                        className="w-full text-left p-4 rounded-xl border transition-all duration-300 active:scale-[0.98] group flex items-start gap-4"
                        style={{ borderColor, backgroundColor: bgColor, opacity }}
                      >
                        <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white/30 transition-colors">
                          <span className="text-[10px] font-bold text-gray-500">{String.fromCharCode(65 + idx)}</span>
                        </div>
                        <span className={`text-sm font-medium ${isSelected || (isAnswered && isCorrect) ? 'text-white' : 'text-gray-400'}`}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && wasCorrect === false && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-6"
                    >
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Por que está errado?</p>
                        <p className="text-xs text-gray-300 leading-relaxed italic">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                      <Button variant="danger" onClick={handleAcceptFailure}>
                        Aceitar Destino e Resetar
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAnswered && wasCorrect === true && (
                   <motion.p 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-center text-green-500 text-xs font-bold mt-8 uppercase tracking-widest"
                   >
                     Correto. Carregando próximo...
                   </motion.p>
                )}
              </motion.div>
            )}

            {gameState === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 uppercase italic">Acesso Restaurado</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  A biologia do seu cérebro foi validada. Sua ofensiva foi salva. Não cometa o mesmo erro hoje.
                </p>
                <Button onClick={onSuccess}>Continuar</Button>
              </motion.div>
            )}

            {gameState === 'FAILED' && (
              <motion.div 
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center"
              >
                <div className="w-20 h-20 bg-red-600 border-2 border-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(220,38,38,0.6)]">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 uppercase italic">Ofensiva Perdida</h1>
                <p className="text-red-500 text-xs font-bold tracking-widest mb-4 uppercase">Reset Completo</p>
                <p className="text-gray-500 text-xs mb-10">Você falhou no teste de consciência. Recomece do zero e aprenda com o processo.</p>
                <Button onClick={onFail} variant="danger">Recomeçar Agora</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>,
    document.body
  );
};
