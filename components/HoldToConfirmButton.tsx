
import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface HoldToConfirmButtonProps {
  onComplete: () => void;
  isLoading?: boolean;
  label?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({ 
  onComplete, 
  isLoading = false, 
  label = 'MANTER OFENSIVA'
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const controls = useAnimation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const HOLD_DURATION = 2000;

  const startHold = () => {
    if (isLoading) return;
    setIsHolding(true);
    
    // Start progress animation
    controls.start({
      width: '100%',
      transition: { duration: HOLD_DURATION / 1000, ease: "linear" }
    });

    // Set timer for completion
    timerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(200);
      onComplete();
      resetHold();
    }, HOLD_DURATION);
  };

  const resetHold = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Snap back progress
    controls.start({
      width: '0%',
      transition: { duration: 0.2 }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative w-[85%] mx-auto group">
      <button
        onMouseDown={startHold}
        onMouseUp={resetHold}
        onMouseLeave={resetHold}
        onTouchStart={startHold}
        onTouchEnd={resetHold}
        disabled={isLoading}
        className={`
          relative w-full py-4 rounded-xl bg-[#050505] border border-violet-500/50
          overflow-hidden select-none touch-none active:scale-[0.98] transition-all
          ${isHolding ? 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'shadow-[0_0_15px_rgba(139,92,246,0.15)]'}
        `}
      >
        {/* Background Progress Layer */}
        <motion.div
          initial={{ width: '0%' }}
          animate={controls}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-40"
        />

        {/* Content Layer */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            // DESIGN CHANGE: Borda de carregamento alterada de branco para cinza
            <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
          ) : (
            <>
              <motion.svg 
                animate={isHolding ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className={`w-4 h-4 ${isHolding ? 'text-white' : 'text-violet-500'}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.5c-4.1 0-7.5-3.4-7.5-7.5 0-3.5 2.1-6.1 4.5-8.5.6-.6 1.3-1.2 1.8-1.9.4-.5.7-1.1.9-1.8.1-.3.5-.4.8-.2.5.4 1 1.2 1.1 2.1.1.8-.1 1.6-.5 2.3-.3.4-.6.8-.9 1.2-1.8 2.3-3.2 4.1-3.2 6.7 0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8c0-1.8-.9-3.7-2.6-5.3-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 2 1.8 3.1 4.1 3.1 6.1 0 4.1-3.4 7.5-7.5 7.5z"/>
              </motion.svg>
              <span className={`text-sm font-bold uppercase tracking-widest ${isHolding ? 'text-white' : 'text-gray-300'}`}>
                {isHolding ? 'Mantenha pressionado...' : label}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};
