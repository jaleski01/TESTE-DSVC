
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { DailyMission, COLORS } from '../types';
import { Check, X, ArrowLeft, ArrowRight, Hand, Zap } from 'lucide-react';

interface MissionSwipeCardProps {
  mission: DailyMission;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const MissionSwipeCard: React.FC<MissionSwipeCardProps> = ({ mission, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.1)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']);

  const rejectOpacity = useTransform(x, [-45, -10], [1, 0]);
  const acceptOpacity = useTransform(x, [10, 45], [0, 1]);
  
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
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative w-full aspect-[3/4] max-w-[280px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

      {/* Rótulos Aceitar/Pular */}
      <motion.div style={{ opacity: acceptOpacity }} className="absolute top-4 right-4 text-green-400 z-20">
        <div className="bg-green-500/20 p-2 rounded-full border border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.5)]">
          <Check size={32} strokeWidth={3} />
        </div>
      </motion.div>

      <motion.div style={{ opacity: rejectOpacity }} className="absolute top-4 left-4 text-red-500 z-20">
        <div className="bg-red-500/20 p-2 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <X size={32} strokeWidth={3} />
        </div>
      </motion.div>

      <div className="z-10 flex flex-col items-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/30">
          <Zap size={24} className="text-violet-400 fill-violet-400/20" />
        </div>
        
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
          {mission.label}
        </h3>
        
        <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8 px-2">
          {mission.desc}
        </p>

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} className="text-red-500/50" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolha agora</span>
          <ArrowRight size={16} className="text-green-500/50" />
        </motion.div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <motion.div 
          style={{ opacity: rejectOpacity }}
          className="absolute transform -rotate-12 border-4 border-red-500 rounded-xl px-4 py-2 bg-black/80 backdrop-blur-md"
        >
          <span className="text-4xl font-black text-red-400 tracking-widest uppercase">PULAR</span>
        </motion.div>

        <motion.div 
          style={{ opacity: acceptOpacity }}
          className="absolute transform rotate-12 border-4 border-green-500 rounded-xl px-4 py-2 bg-black/80 backdrop-blur-md"
        >
          <span className="text-4xl font-black text-green-400 tracking-widest uppercase">ACEITAR</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
