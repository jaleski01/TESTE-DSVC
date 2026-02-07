import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  targetId: string;
  title: string;
  content: string;
}

const TOUR_STEPS: Step[] = [
  {
    targetId: 'tour-timer',
    title: '⏱️ Tempo de Liberdade',
    content: 'Este cronômetro é seu troféu. Ele marca seu tempo limpo. Proteja-o.'
  },
  {
    targetId: 'tour-reality',
    title: '🧠 NeuroDebug',
    content: 'Seus desafios diários para reprogramação mental. Pontue aqui todos os dias.'
  },
  {
    targetId: 'tour-streak',
    title: '🔥 Ofensiva & Hábitos',
    content: 'Registre suas vitórias e gatilhos aqui. Mantenha a chama acesa para evoluir.'
  }
];

interface OnboardingTourProps {
  isReady: boolean;
  onTourStateChange?: (isActive: boolean) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isReady, onTourStateChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isReady) return;
    const hasSeenTour = localStorage.getItem('has_seen_onboarding_tour');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [isReady]);

  // Efeito para travar o Scroll e avisar o pai
  useEffect(() => {
    if (isVisible) {
      if (onTourStateChange) onTourStateChange(true);
      document.body.style.overflow = 'hidden';
    } else {
      if (onTourStateChange) onTourStateChange(false);
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, onTourStateChange]);

  useLayoutEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const step = TOUR_STEPS[currentStep];
      const element = document.getElementById(step.targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          // Scroll suave para garantir que o elemento destacado esteja visível (centralizado)
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 200); 
    window.addEventListener('resize', updatePosition);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_onboarding_tour', 'true');
  };

  if (!isVisible || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] pointer-events-none"
      >
        {/* Overlay Escuro Total - Impede cliques fora */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={finishTour} />

        {/* Sombra de Fundo com Recorte no Elemento */}
        <motion.div
          className="absolute rounded-xl border-2 border-violet-500 shadow-[0_0_50px_rgba(139,92,246,0.4)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.9)'
          }}
          layoutId="highlight-box"
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />

        {/* Card de Texto FIXO no Rodapé (Bottom Sheet) */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={currentStep}
          className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-violet-500/30 p-6 rounded-t-3xl shadow-2xl flex flex-col gap-4 pointer-events-auto z-[10001]"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-white">{step.title}</h3>
            <div className="text-xs font-bold text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
              Passo {currentStep + 1} de {TOUR_STEPS.length}
            </div>
          </div>
          
          <p className="text-sm text-gray-300 font-medium leading-relaxed">
            {step.content}
          </p>

          <div className="flex gap-4 mt-2">
            <button 
              onClick={finishTour}
              className="flex-1 py-3.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              PULAR
            </button>
            <button 
              onClick={handleNext}
              className="flex-[2] py-3.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 active:scale-95 transition-all"
            >
              {isLastStep ? 'CONCLUIR' : 'CONTINUAR'}
              {isLastStep ? <Check size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          <div className="h-4 w-full" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};