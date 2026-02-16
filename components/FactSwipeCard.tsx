
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RealityFact } from '../data/realityCheckData';
import { Check, X } from 'lucide-react';

interface FactSwipeCardProps {
  fact: RealityFact;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const FactSwipeCard: React.FC<FactSwipeCardProps> = ({ fact, onSwipe }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // 1. Motion Values & Transforms
  const x = useMotionValue(0);
  // Vincula a rotação ao movimento X para feedback natural (Prioridade de Rotação Manual)
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.2)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)']);
  
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
    // Se não atingir o limiar, o spring do transition trará o card de volta ao centro (0)
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      // Desativa animação "breathing" assim que o usuário toca no card
      onDragStart={() => setHasInteracted(true)}
      onDragEnd={handleDragEnd}
      
      // 2. Desativação Total da Animação de Instrução durante interação
      // Se interagiu (arrastando), removemos os keyframes para que o 'drag' (x) e 'style' (rotate) assumam controle total.
      animate={!hasInteracted ? {
        x: [0, -5, 0, 5, 0],
        rotate: [0, -1, 0, 1, 0] 
      } : undefined}
      
      // 3. Ajuste de Transição
      // Alterna entre o loop suave (idle) e a física de mola (release do drag)
      transition={!hasInteracted ? {
        duration: 6,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      } : {
        type: "spring",
        stiffness: 300,
        damping: 30
      }}

      className="relative w-full aspect-[3/4] max-w-[280px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* Dynamic Background Overlays */}
      <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

      {/* Floating Icons */}
      <motion.div 
        style={{ opacity: useTransform(x, [50, 100], [0, 1]) }} 
        className="absolute top-4 right-4 text-green-500"
      >
        <div className="bg-green-500/20 p-2 rounded-full border border-green-500/50">
          <Check size={32} />
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity: useTransform(x, [-50, -100], [0, 1]) }} 
        className="absolute top-4 left-4 text-red-500"
      >
        <div className="bg-red-500/20 p-2 rounded-full border border-red-500/50">
          <X size={32} />
        </div>
      </motion.div>

      <div className="z-10 flex flex-col items-center pointer-events-none">
        <div className="w-12 h-1 bg-violet-500/30 rounded-full mb-8" />
        <h3 className="text-xl font-bold text-slate-200 leading-tight">
          {fact.statement}
        </h3>
        
        {/* Oculta instrução visualmente ao interagir para limpar a UI */}
        <motion.p 
            animate={{ opacity: hasInteracted ? 0 : 1 }}
            className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest font-black"
        >
          Arraste para os lados
        </motion.p>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8 text-[10px] font-bold tracking-widest text-gray-600 uppercase w-full pointer-events-none">
        <span className="text-red-900/40">Mito</span>
        <span className="text-green-900/40">Verdade</span>
      </div>
    </motion.div>
  );
};
