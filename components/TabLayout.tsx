
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes } from '../types';

/**
 * TabLayout (Hub de Navegação)
 * Refatorado com Glassmorphism Premium.
 * Atua como o menu inferior fixo da aplicação.
 */
export const TabLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 pb-[env(safe-area-inset-bottom)] bg-[#0F0A15]"
      style={{ 
        height: '68px',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.03)' // Borda sutil de luz superior
      }}
    >
      <div className="flex justify-around items-center h-full px-2 pb-1 relative">
        
        <TabButton 
          isActive={isActive(Routes.DASHBOARD)} 
          onClick={() => navigate(Routes.DASHBOARD)} 
          label="Home"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </TabButton>

        <TabButton 
          isActive={isActive(Routes.PROGRESS)} 
          onClick={() => navigate(Routes.PROGRESS)} 
          label="Evolução"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </TabButton>

        <TabButton 
          isActive={isActive(Routes.LEARNING)} 
          onClick={() => navigate(Routes.LEARNING)} 
          label="Base"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </TabButton>

        <TabButton 
          isActive={isActive(Routes.PROFILE)} 
          onClick={() => navigate(Routes.PROFILE)} 
          label="Perfil"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </TabButton>

      </div>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, label, children }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center w-full h-full space-y-1.5 
        transition-all duration-300 ease-out active:scale-95 group
        ${isActive ? 'text-violet-500' : 'text-zinc-600 hover:text-zinc-400'}
      `}
    >
      {/* Background Glow for Active State (Subtle) */}
      {isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-violet-500/10 rounded-full blur-xl opacity-100 pointer-events-none transition-opacity duration-500" />
      )}

      <div className="relative">
        <svg 
          className={`w-6 h-6 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_12px_rgba(139,92,246,1)]' : ''}`}
          fill={isActive ? "currentColor" : "none"} 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={isActive ? 0 : 2}
        >
          {children}
        </svg>
      </div>

      <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${isActive ? 'text-white opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
    </button>
  );
}
