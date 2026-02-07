
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
    content: 'Este é o seu cronômetro sagrado. Ele marca o tempo exato que você está livre. Se recair, ele zera. Proteja este tempo com sua vida.'
  },
  {
    targetId: 'tour-reality',
    title: '🧠 Reality Check & Pontos',
    content: 'Desafios diários para reprogramar seu cérebro. Complete-os para ganhar pontos e prêmios especiais. A consistência aqui é a chave da cura.'
  },
  {
    targetId: 'tour-streak',
    title: '🔥 Sua Ofensiva Diária',
    content: 'Aqui é seu campo de batalha. Ao final de cada dia, marque sua vitória e registre gatilhos. Manter a ofensiva alta libera prêmios exclusivos.'
  }
];

interface OnboardingTourProps {
  isReady: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isReady }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Só inicia se a tela estiver pronta (loading terminou)
    if (!isReady) return;

    const hasSeenTour = localStorage.getItem('has_seen_onboarding_tour');
    if (!hasSeenTour) {
      // Pequeno delay para garantir renderização final do DOM
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  useLayoutEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const step = TOUR_STEPS[currentStep];
      const element = document.getElementById(step.targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        // Se o elemento estiver zerado (invisível), não atualiza para evitar bugs
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    // Tenta atualizar imediatamente e em intervalos curtos caso o layout mude
    updatePosition();
    const interval = setInterval(updatePosition, 500); 
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_onboarding_tour', 'true');
  };

  if (!isVisible || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  
  // Posicionamento inteligente do balão (se o elemento estiver muito embaixo, joga o balão pra cima)
  const isTopPosition = targetRect.top > window.innerHeight / 2;
  const popoverStyle: React.CSSProperties = isTopPosition 
    ? { bottom: window.innerHeight - targetRect.top + 20, left: 20, right: 20 }
    : { top: targetRect.bottom + 20, left: 20, right: 20 };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none" // pointer-events-none para não bloquear scroll se algo der errado
      >
        {/* Destaque + Overlay usando Box Shadow Gigante (Infalível) */}
        <motion.div
          layoutId="highlight-box"
          className="absolute rounded-xl border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            // O segredo: uma sombra sólida gigante que escurece o resto da tela
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)' 
          }}
          transition={{ type: "spring", stiffness: 250, damping: 30 }}
        />

        {/* Balão de Texto (pointer-events-auto para permitir cliques nos botões) */}
        <motion.div
          initial={{ opacity: 0, y: isTopPosition ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStep}
          className="absolute mx-auto max-w-sm bg-[#151515] border border-violet-500/30 p-5 rounded-xl shadow-2xl flex flex-col gap-3 pointer-events-auto"
          style={popoverStyle}
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-base text-white">{step.title}</h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 leading-relaxed font-medium">
            {step.content}
          </p>

          <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
            <button 
              onClick={handleComplete}
              className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              Pular
            </button>
            <button 
              onClick={handleNext}
              className="flex-[2] py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              {isLastStep ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
