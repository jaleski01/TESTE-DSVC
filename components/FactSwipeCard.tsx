
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RealityFact } from '../data/realityCheckData';
import { Check, X } from 'lucide-react';

interface FactSwipeCardProps {
  fact: RealityFact;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const FactSwipeCard: React.FC<FactSwipeCardProps> = ({ fact, onSwipe }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // 1. Motion Values & Transforms (Otimização de Renderização)
  const x = useMotionValue(0);
  
  // Rotação sutil baseada no movimento X
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  
  // Opacidade para fade-out nas extremidades
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Backgrounds coloridos baseados na direção
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.2)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)']);
  
  // Escala dos ícones de feedback
  const checkScale = useTransform(x, [50, 100], [0.5, 1.2]);
  const xScale = useTransform(x, [-50, -100], [0.5, 1.2]);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasInteracted(true);
  };
  
  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    
    // Limiar de disparo (Threshold)
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7} // Sensação elástica profissional
      
      // FÍSICA DE MOVIMENTO (Segredo da Fluidez)
      // bounceStiffness alto = retorno rápido; bounceDamping baixo = oscilação orgânica mínima
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      
      // ANIMAÇÃO DE INSTRUÇÃO (NUDGE)
      // Só executa se o usuário ainda não tocou. Some instantaneamente ao interagir.
      animate={!hasInteracted ? { 
        x: [0, -8, 0, 8, 0],
        rotate: [0, -1, 0, 1, 0]
      } : {}}
      
      // CONFIGURAÇÃO DE TRANSIÇÃO HÍBRIDA
      transition={!hasInteracted ? {
        // Loop infinito suave para chamar atenção
        repeat: Infinity,
        duration: 2.5,
        ease: "easeInOut"
      } : {
        // Física de mola reativa para interação tátil (Zero Latência)
        type: "spring",
        stiffness: 400,
        damping: 30
      }}

      className={`relative w-full aspect-[3/4] max-w-[280px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Dynamic Background Overlays */}
      <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

      {/* Floating Icons (Feedback Visual Imediato) */}
      <motion.div 
        style={{ opacity: useTransform(x, [20, 100], [0, 1]), scale: checkScale }} 
        className="absolute top-6 right-6 text-green-500 z-20"
      >
        <div className="bg-green-500/20 p-3 rounded-full border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
          <Check size={32} strokeWidth={3} />
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity: useTransform(x, [-20, -100], [0, 1]), scale: xScale }} 
        className="absolute top-6 left-6 text-red-500 z-20"
      >
        <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <X size={32} strokeWidth={3} />
        </div>
      </motion.div>

      {/* Card Content */}
      <div className="z-10 flex flex-col items-center pointer-events-none w-full h-full justify-between py-4">
        <div className="w-12 h-1 bg-violet-500/30 rounded-full mb-4" />
        
        <div className="flex-1 flex items-center justify-center">
          <h3 className="text-xl font-bold text-slate-200 leading-snug">
            {fact.statement}
          </h3>
        </div>
        
        {/* Instrução Visual que desaparece ao toque */}
        <motion.div 
            animate={{ opacity: hasInteracted ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="h-10 flex items-center justify-center"
        >
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black animate-pulse">
            Arraste para os lados
          </p>
        </motion.div>
      </div>

      {/* Rodapé Fixo de Legenda */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8 w-full pointer-events-none">
        <span className="text-[10px] font-black tracking-widest uppercase text-red-500/50 drop-shadow-sm">Mito</span>
        <span className="text-[10px] font-black tracking-widest uppercase text-green-500/50 drop-shadow-sm">Verdade</span>
      </div>
    </motion.div>
  );
};
