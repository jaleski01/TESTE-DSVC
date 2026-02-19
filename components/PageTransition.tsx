import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', id }) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ 
        duration: 0.35, 
        ease: [0.22, 1, 0.36, 1] // Curva de aceleração nativa da Apple (easeOut)
      }}
      className={`w-full flex-1 flex flex-col overflow-hidden bg-transparent ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};