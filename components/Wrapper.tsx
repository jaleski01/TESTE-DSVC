import React from 'react';
import { TabLayout } from './TabLayout';
import { COLORS } from '../types';

interface WrapperProps {
  children: React.ReactNode;
  noPadding?: boolean;
  hideNavigation?: boolean;
  centerContent?: boolean;
  // Added optional className prop to allow custom background and container styles
  className?: string;
}

/**
 * Wrapper Component
 * Identidade Cyberpunk Introspectivo: Fundo transparente para herdar o gradiente global.
 * Gerencia a renderização do Hub de navegação e a área de conteúdo principal.
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
      // Merged custom className with default container styles
      className={`flex flex-col h-[100dvh] w-full text-white overflow-hidden relative bg-transparent ${className}`}
    >
      {/* Área de conteúdo principal */}
      <main 
        className={`
          flex-1 w-full relative overflow-hidden flex flex-col 
          ${!noPadding ? 'px-6' : ''} 
          ${centerContent ? 'justify-center items-center' : ''}
          backdrop-blur-[2px]
        `}
      >
        {children}
      </main>

      {/* Renderização condicional do Hub de Navegação */}
      {!hideNavigation && <TabLayout />}
    </div>
  );
};