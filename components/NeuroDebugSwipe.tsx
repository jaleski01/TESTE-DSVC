
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RealityFact } from '../data/realityCheckData';
import { Check, X, ArrowLeft, ArrowRight, Hand, Brain } from 'lucide-react';

interface NeuroDebugSwipeProps {
  item: RealityFact;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const NeuroDebugSwipe: React.FC<NeuroDebugSwipeProps> = ({ item, onSwipe }) => {
  const x = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.1)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']);

  const mythOpacity = useTransform(x, [-45, -10], [1, 0]);
  const truthOpacity = useTransform(x, [10, 45], [0, 1]);
  
  const mythScale = useTransform(x, [-45, -10], [1.1, 0.8]);
  const truthScale = useTransform(x, [10, 45], [0.8, 1.1]);
  
  const handleDragEnd = (_: any, info: any) => {
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
      onDragEnd={handleDragEnd}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="relative w-full aspect-[3/4] max-w-[300px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden group"
    >
      <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

      {/* Icons Overlay */}
      <motion.div 
        style={{ opacity: truthOpacity, scale: truthScale }} 
        className="absolute top-6 right-6 text-emerald-400 z-20"
      >
        <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <Check size={32} strokeWidth={3} />
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity: mythOpacity, scale: mythScale }} 
        className="absolute top-6 left-6 text-rose-500 z-20"
      >
        <div className="bg-rose-500/20 p-2 rounded-full border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
          <X size={32} strokeWidth={3} />
        </div>
      </motion.div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center pointer-events-none w-full">
        <div className="flex items-center gap-2 mb-4">
           <Brain size={16} className="text-violet-500" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">FONTE: {item.source}</span>
        </div>
        
        <h3 className="text-xl font-bold text-white leading-tight mb-6">
          {item.statement}
        </h3>
        
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Análise de Realidade</p>

        <motion.div
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mt-12 flex items-center justify-center gap-2 pointer-events-none"
        >
          <ArrowLeft size={14} className="text-rose-500/50" />
          <Hand size={14} className="text-slate-600 -rotate-12" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
            DECIDIR AGORA
          </span>
          <Hand size={14} className="text-slate-600 rotate-12 scale-x-[-1]" />
          <ArrowRight size={14} className="text-emerald-500/50" />
        </motion.div>
      </div>

      {/* Neon Labels */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <motion.div 
          style={{ opacity: mythOpacity, scale: mythScale }}
          className="absolute transform -rotate-12 border-4 border-rose-500 rounded-xl px-6 py-3 bg-black/90 backdrop-blur-xl shadow-[0_0_40px_rgba(244,63,94,0.5)]"
        >
          <span className="text-4xl font-black text-rose-400 tracking-widest uppercase italic">MITO</span>
        </motion.div>

        <motion.div 
          style={{ opacity: truthOpacity, scale: truthScale }}
          className="absolute transform rotate-12 border-4 border-emerald-500 rounded-xl px-6 py-3 bg-black/90 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.5)]"
        >
          <span className="text-4xl font-black text-emerald-400 tracking-widest uppercase italic">FATO</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
