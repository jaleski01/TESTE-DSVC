
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight } from 'lucide-react';

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
    targetId: 'tour-streak',
    title: '🔥 Sua Ofensiva Diária',
    content: 'Aqui é seu campo de batalha. Ao final de cada dia, marque sua vitória e registre gatilhos. Manter a ofensiva alta libera prêmios exclusivos.'
  },
  {
    targetId: 'tour-reality',
    title: '🧠 Reality Check & Pontos',
    content: 'Desafios diários para reprogramar seu cérebro. Complete-os para ganhar pontos e prêmios especiais. A consistência aqui é a chave da cura.'
  }
];

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Verifica se o usuário já viu o tour
    const hasSeenTour = localStorage.getItem('has_seen_onboarding_tour');
    if (!hasSeenTour) {
      // Pequeno delay para garantir que a tela carregou
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Atualiza a posição do destaque quando o passo muda ou a tela redimensiona
  useLayoutEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const step = TOUR_STEPS[currentStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll suave até o elemento se ele estiver fora da visão
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
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

  // Calculo para posicionar o balão
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
        className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto"
      >
        {/* Overlay Escuro com Spotlight */}
        <div 
          className="absolute inset-0 bg-black/80 transition-all duration-300 ease-out"
          style={{
            maskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px, transparent ${Math.max(targetRect.width, targetRect.height)/1.5}px, black ${Math.max(targetRect.width, targetRect.height)/1.4}px)`,
            WebkitMaskImage: `radial-gradient(circle at ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px, transparent ${Math.max(targetRect.width, targetRect.height)/1.5}px, black ${Math.max(targetRect.width, targetRect.height)/1.4}px)`
          } as any}
        />

        {/* Borda do Spotlight */}
        <motion.div
          layoutId="highlight-box"
          className="absolute border-2 border-violet-500 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.6)] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Balão de Conteúdo */}
        <motion.div
          initial={{ opacity: 0, y: isTopPosition ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStep}
          className="absolute mx-auto max-w-sm bg-[#1A1A1A] border border-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4"
          style={popoverStyle}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-black text-lg text-white italic uppercase tracking-tighter">{step.title}</h3>
            <span className="text-[10px] font-black text-gray-500 bg-gray-900 px-2 py-1 rounded border border-white/5">
              {currentStep + 1}/{TOUR_STEPS.length}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 leading-relaxed font-medium">
            {step.content}
          </p>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={handleComplete}
              className="flex-1 py-3 text-xs font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Pular
            </button>
            <button 
              onClick={handleNext}
              className="flex-[2] py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 transition-all active:scale-95 uppercase tracking-widest"
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
