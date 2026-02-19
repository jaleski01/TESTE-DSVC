
import React from 'react';
import { motion } from 'framer-motion';

export const LearningSkeleton: React.FC = () => {
  const skeletonCards = [1, 2, 3, 4]; // Matches initial view density

  return (
    <div className="w-full space-y-5">
      {skeletonCards.map((i) => (
        <div 
          key={i} 
          className="w-full h-32 rounded-3xl bg-[#0F0A15]/60 border border-[#2E243D] p-5 flex items-center gap-5 relative overflow-hidden"
        >
          {/* Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent z-0"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          />
          
          {/* Icon Placeholder */}
          <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0 border border-white/5 relative z-10" />
          
          {/* Text Placeholders */}
          <div className="flex-1 space-y-3 relative z-10">
            <div className="h-4 bg-white/10 rounded-md w-3/4" />
            <div className="h-3 bg-white/5 rounded-md w-1/2" />
            <div className="h-2 bg-white/[0.02] rounded-md w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
