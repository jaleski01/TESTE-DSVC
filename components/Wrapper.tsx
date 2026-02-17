
import React from 'react';
import { TabLayout } from './TabLayout';
import { COLORS } from '../types';

interface WrapperProps {
  children: React.ReactNode;
  noPadding?: boolean;
  hideNavigation?: boolean;
  centerContent?: boolean;
  className?: string;
}

/**
 * Wrapper Component - Visual Immersion Layer
 * Implements the "Digital Fog" aesthetic with animated orbs, glassmorphism, 
 * and a cinematic vignette.
 */
export const Wrapper: React.FC<WrapperProps> = ({ 
  children, 
  noPadding = false, 
  hideNavigation = false,
  centerContent = false,
  className = ''
}) => {
  return (
    <div 
      className={`relative flex flex-col h-[100dvh] w-full text-white overflow-hidden bg-void ${className}`}
    >
      {/* --- VISUAL IMMERSION LAYER (BACKGROUND) --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Orb 1: Deep Purple (Top Left) - Breathing */}
        <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] bg-violet-900/20 rounded-full blur-[100px] animate-blob mix-blend-screen" />
        
        {/* Orb 2: Dark Cyan (Bottom Right) - Drifting */}
        <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[80px] animate-blob-slow animation-delay-2000 mix-blend-screen" />
        
        {/* Orb 3: Void/Black Anchor (Center) - Depth */}
        <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[50vw] bg-indigo-950/20 rounded-full blur-[90px] animate-pulse-slow" />

        {/* Digital Noise / Film Grain (Texture) */}
        <div className="absolute inset-0 bg-noise opacity-30" />

        {/* Cinematic Vignette (Focus on Center) */}
        <div className="absolute inset-0 bg-radial-vignette" />
      </div>

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
