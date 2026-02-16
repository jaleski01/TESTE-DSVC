
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
 * Wrapper Component - Mobile Edge-to-Edge Optimized
 * O fundo (background) herda o gradiente global que ocupa 100% da tela física.
 * O conteúdo interno respeita as Safe Areas (Notch e Gestures bar).
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
      className={`flex flex-col h-[100dvh] w-full text-white overflow-hidden relative bg-transparent ${className}`}
    >
      {/* 
        Main Area com Safe Area Padding.
        pt-[max(1rem,env(safe-area-inset-top))]: Garante que o conteúdo não fique sob o notch.
        pb-[env(safe-area-inset-bottom)]: Protege contra a barra de gestos do iOS/Android.
      */}
      <main 
        className={`
          flex-1 w-full relative overflow-hidden flex flex-col 
          pt-[max(1rem,env(safe-area-inset-top))]
          pb-[env(safe-area-inset-bottom)]
          ${!noPadding ? 'px-6' : ''} 
          ${centerContent ? 'justify-center items-center' : ''}
          backdrop-blur-[2px]
        `}
      >
        {children}
      </main>

      {/* Navegação Inferior */}
      {!hideNavigation && <TabLayout />}
    </div>
  );
};
