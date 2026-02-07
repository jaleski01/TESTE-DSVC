
import React from 'react';
import { BaseProps, COLORS } from '../types';

interface WrapperProps extends BaseProps {
  centerContent?: boolean;
  noPadding?: boolean;
}

/**
 * Wrapper Component
 * Identidade Cyberpunk Introspectivo: Fundo transparente para herdar o gradiente global.
 */
export const Wrapper: React.FC<WrapperProps> = ({ 
  children, 
  className = '', 
  centerContent = false,
  noPadding = false
}) => {
  return (
    <div 
      className={`
        h-[100dvh] w-full flex flex-col relative overflow-hidden bg-transparent
        ${centerContent ? 'justify-center items-center' : ''}
        ${className}
      `}
      style={{ 
        color: COLORS.TextPrimary 
      }}
    >
      <div 
        className={`
          flex-1 w-full max-w-md mx-auto flex flex-col h-full overflow-hidden
          ${!noPadding ? 'px-6 py-4' : ''} 
          backdrop-blur-[2px]
        `}
      >
        {children}
      </div>
    </div>
  );
};
