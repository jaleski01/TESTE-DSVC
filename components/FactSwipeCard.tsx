
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RealityFact } from '../data/realityCheckData';
import { Check, X, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

interface FactSwipeCardProps {
  fact: RealityFact;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const FactSwipeCard: React.FC<FactSwipeCardProps> = ({ fact, onSwipe }) => {
  // 1. Motion Values & Transforms
  const x = useMotionValue(0);
  
  // Vincula a rotação ao movimento X para feedback natural
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Background Colors (Sutil)
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.1)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']);

  // Opacidade dos Rótulos Neon (Reatividade Alta/Instantânea)
  // Mito (Esquerda): Aparece totalmente ao arrastar apenas 45px para esquerda
  const mythOpacity = useTransform(x, [-45, -10], [1, 0]);
  // Verdade (Direita): Aparece totalmente ao arrastar apenas 45px para direita
  const truthOpacity = useTransform(x, [10, 45], [0, 1]);
  
  // Escala para efeito "Pop"
  const mythScale = useTransform(x, [-45, -10], [1.1, 0.8]);
  const truthScale = useTransform(x, [10, 45], [0.8, 1.1]);
  
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
      onDragEnd={handleDragEnd}
      
      // Animação de retorno (mola) quando o usuário solta o card
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}

      className="relative w-full aspect-[3/4] max-w-[280px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden group"
    >
      {/* Dynamic Background Overlays */}
      <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

      {/* Ícones Flutuantes (Topo) */}
      <motion.div 
        style={{ opacity: truthOpacity, scale: truthScale }} 
        className="absolute top-4 right-4 text-green-400 z-20"
      >
        <div className="bg-green-500/20 p-2 rounded-full border border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.5)]">
          <Check size={32} strokeWidth={3} />
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity: mythOpacity, scale: mythScale }} 
        className="absolute top-4 left-4 text-red-500 z-20"
      >
        <div className="bg-red-500/20 p-2 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <X size={32} strokeWidth={3} />
        </div>
      </motion.div>

      {/* Conteúdo Principal */}
      <div className="z-10 flex flex-col items-center pointer-events-none">
        <div className="w-12 h-1 bg-violet-500/30 rounded-full mb-8" />
        <h3 className="text-xl font-bold text-slate-200 leading-tight select-none">
          {fact.statement}
        </h3>
        
        {/* Nova Call-to-Action Animada (Refinada: Respiração Suave) */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1.02, 0.98],
            filter: [
              'drop-shadow(0 0 0px rgba(139,92,246,0))',
              'drop-shadow(0 0 8px rgba(139,92,246,0.3))',
              'drop-shadow(0 0 0px rgba(139,92,246,0))'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mt-16 flex items-center justify-center gap-2 pointer-events-none pb-2"
        >
          <ArrowLeft size={16} className="text-violet-500" />
          
          <Hand size={16} className="text-slate-400 -rotate-12" />
          
          <span className="text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] px-1">
            ARRASTE PARA OS LADOS
          </span>

          <Hand size={16} className="text-slate-400 rotate-12 scale-x-[-1]" />
          
          <ArrowRight size={16} className="text-violet-500" />
        </motion.div>
      </div>

      {/* RÓTULOS NEON (Sobrepostos e Reativos) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
        
        {/* Rótulo MITO (Arrastar p/ Esquerda) */}
        <motion.div 
          style={{ opacity: mythOpacity, scale: mythScale }}
          className="absolute transform -rotate-12 border-4 border-red-500 rounded-xl px-4 py-2 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        >
          <span className="text-4xl font-black text-red-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(248,113,113,0.8)] whitespace-nowrap">
            MITO
          </span>
        </motion.div>

        {/* Rótulo VERDADE (Arrastar p/ Direita) */}
        <motion.div 
          style={{ opacity: truthOpacity, scale: truthScale }}
          className="absolute transform rotate-12 border-4 border-green-500 rounded-xl px-4 py-2 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.4)]"
        >
          <span className="text-4xl font-black text-green-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] whitespace-nowrap">
            VERDADE
          </span>
        </motion.div>

      </div>
    </motion.div>
  );
};
