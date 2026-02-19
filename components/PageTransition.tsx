
import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * PageTransition - Camada de animação acelerada por hardware.
 * Simula a sensação de profundidade e fluidez do iOS.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', id }) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.02, y: -8 }}
      transition={{ 
        duration: 0.28, 
        ease: [0.32, 0.72, 0, 1] // Custom iOS-like Cubic Bezier
      }}
      className={`w-full flex-1 flex flex-col overflow-hidden bg-transparent ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};
