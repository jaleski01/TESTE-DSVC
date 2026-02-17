
import React from 'react';
import { TabLayout } from './TabLayout';
import { COLORS } from '../types';

interface WrapperProps {
  children: React.ReactNode;
  noPadding?: boolean;
  hideNavigation?: boolean;
  centerContent?: boolean;
  className?: string;
  disableDefaultBackground?: boolean;
}

/**
 * Wrapper Component - Visual Immersion Layer
 * Implements the unified "Violet/Cyan" atmosphere across the entire app.
 */
export const Wrapper: React.FC<WrapperProps> = ({ 
  children, 
  noPadding = false, 
  hideNavigation = false,
  centerContent = false,
  className = '',
  disableDefaultBackground = false
}) => {
  return (
    <div 
      className={`relative flex flex-col h-[100dvh] w-full text-white overflow-hidden bg-void ${className}`}
    >
      {/* --- UNIFIED ATMOSPHERE BACKGROUND (Extracted from Dashboard) --- */}
      {!disableDefaultBackground && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {/* Violet Orb (Top Center/Left) */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px]" />
          {/* Cyan Orb (Bottom Right) */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[80px]" />
        </div>
      )}

      {/* --- CONTENT LAYER --- */}
      <main 
        className={`
          flex-1 w-full relative z-10 flex flex-col 
          pt-[max(1rem,env(safe-area-inset-top))]
          pb-[env(safe-area-inset-bottom)]
          ${!noPadding ? 'px-6' : ''} 
          ${centerContent ? 'justify-center items-center' : ''}
          /* Ensure smooth scrolling within the container */
          overflow-hidden
        `}
      >
        {children}
      </main>

      {/* Navegação Inferior (Glassmorphic Hub) */}
      {!hideNavigation && <TabLayout />}
    </div>
  );
};
