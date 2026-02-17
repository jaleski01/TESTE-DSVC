
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RealityFact } from '../data/realityCheckData';
import { Check, X } from 'lucide-react';

interface FactSwipeCardProps {
  fact: RealityFact;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const FactSwipeCard: React.FC<FactSwipeCardProps> = ({ fact, onSwipe }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Motion Values (Hardware Accelerated)
  const x = useMotionValue(0);
  
  // Transforms puramente matemáticos baseados em X (Zero React Rerenders)
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Background Colors Interpolation
  const rightBg = useTransform(x, [0, 150], ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.2)']);
  const leftBg = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)']);
  
  // Icon Scales
  const checkScale = useTransform(x, [50, 100], [0.5, 1.2]);
  const xScale = useTransform(x, [-50, -100], [0.5, 1.2]);
  
  // Opacity for Icons
  const checkOpacity = useTransform(x, [20, 100], [0, 1]);
  const xOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragStart = () => {
    setIsDragging(true);
    // Marcamos interação imediatamente para cancelar o 'nudge' animation
    setHasInteracted(true);
  };
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    const threshold = 100; // Pixels necessários para confirmar o swipe
    
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  return (
    <div className="relative w-full flex justify-center items-center">
      <motion.div
        // 1. Hardware Acceleration & Mobile Optimization
        style={{ 
          x, 
          rotate, 
          opacity, 
          touchAction: 'none' // CRÍTICO: Impede scroll da página durante o arraste
        }}
        
        // 2. Drag Configuration
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} // Sempre volta ao centro se soltar antes
        dragElastic={0.7} // Sensação de peso/resistência
        
        // 3. Event Handlers
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        
        // 4. Animation Logic (Isolamento de Gestos)
        // Se estiver arrastando, animate é null para a física do drag assumir 100%.
        // Se não interagiu, faz o nudge. Se interagiu e soltou, volta pra 0.
        animate={isDragging ? undefined : (
          !hasInteracted ? { 
            x: [0, -10, 0, 10, 0],
            // Rotação removida daqui. Ela acontecerá naturalmente via useTransform quando o X mudar.
          } : { 
            x: 0, 
            rotate: 0 
          }
        )}
        
        // 5. Physics Configuration (Spring Suave)
        transition={!hasInteracted ? {
          // Loop infinito suave para chamar atenção (Nudge)
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut"
        } : {
          // Física de mola reativa para interação tátil (Zero Latência)
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1
        }}

        className={`relative w-full aspect-[3/4] max-w-[280px] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Dynamic Background Overlays (Renderizados via GPU) */}
        <motion.div style={{ backgroundColor: rightBg }} className="absolute inset-0 pointer-events-none" />
        <motion.div style={{ backgroundColor: leftBg }} className="absolute inset-0 pointer-events-none" />

        {/* Floating Icons (Feedback Visual) */}
        <motion.div 
          style={{ opacity: checkOpacity, scale: checkScale }} 
          className="absolute top-6 right-6 text-green-500 z-20 pointer-events-none"
        >
          <div className="bg-green-500/20 p-3 rounded-full border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            <Check size={32} strokeWidth={3} />
          </div>
        </motion.div>

        <motion.div 
          style={{ opacity: xOpacity, scale: xScale }} 
          className="absolute top-6 left-6 text-red-500 z-20 pointer-events-none"
        >
          <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <X size={32} strokeWidth={3} />
          </div>
        </motion.div>

        {/* Card Content */}
        <div className="z-10 flex flex-col items-center pointer-events-none w-full h-full justify-between py-4 select-none">
          <div className="w-12 h-1 bg-violet-500/30 rounded-full mb-4" />
          
          <div className="flex-1 flex items-center justify-center">
            <h3 className="text-xl font-bold text-slate-200 leading-snug">
              {fact.statement}
            </h3>
          </div>
          
          {/* Instrução Visual */}
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
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8 w-full pointer-events-none select-none">
          <span className="text-[10px] font-black tracking-widest uppercase text-red-500/50 drop-shadow-sm">Mito</span>
          <span className="text-[10px] font-black tracking-widest uppercase text-green-500/50 drop-shadow-sm">Verdade</span>
        </div>
      </motion.div>
    </div>
  );
};
