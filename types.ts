
import React from 'react';

// Design System Constants
export const COLORS = {
  Background: 'transparent',      
  Surface: 'rgba(15, 10, 21, 0.6)', // Glassmorphism sutil
  Border: '#2E243D',          
  Primary: '#8B5CF6',         
  Danger: '#FF1744',          
  TextPrimary: '#FFFFFF',     
  TextSecondary: '#9CA3AF',   
  Cyan: '#A78BFA',            
  Success: '#10B981',
  Warning: '#F59E0B'
};

export enum Routes {
  LOGIN = '/',
  ONBOARDING = '/onboarding',
  DASHBOARD = '/dashboard',
  PROGRESS = '/progress',
  LEARNING = '/learning',
  PROFILE = '/profile',
  SOS = '/sos',
  SUPPORT = '/support',
}

export interface UserProfile {
  victory_mode?: string;
  focus_pillar?: string;
  current_streak_start?: string;
  addiction_score?: number;
  onboarding_completed?: boolean;
  daily_addiction_minutes?: number;
  created_at?: string;
  email?: string | null;
  last_updated?: any; // Alterado para any para aceitar FieldValue do Firebase ou string
  selected_habits?: string[]; 
  
  // --- Gamification Fields (Fix TS2345) ---
  currentStreak?: number;        
  longestStreak?: number;        
  lastCheckInDate?: string;      
  unlockedAchievements?: string[]; 
  claimed_rewards?: string[];    
  completed_modules?: string[];  

  gamification?: {
    level: number;
    xp: number;
    achievements: string[];
  };

  // --- Reality Check Progress ---
  reality_check_points?: number; 
  last_fact_date?: string;       
  daily_fact_count?: number;     
  seen_fact_ids?: number[];      

  // Index signature para permitir flexibilidade com dados do Firestore
  [key: string]: any; 
}

export interface HabitDefinition {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

export const MASTER_HABITS: HabitDefinition[] = [
  { id: 'meditacao', label: 'Meditação', desc: 'Acalme a mente e foque no agora.', icon: 'sparkles' },
  { id: 'musculacao', label: 'Musculação', desc: 'Transforme energia em força física.', icon: 'barbell' },
  { id: 'leitura', label: 'Leitura Focada', desc: 'Evolua seu intelecto diariamente.', icon: 'book' },
  { id: 'banho_gelado', label: 'Banho Gelado', desc: 'Discipline seu corpo e mente.', icon: 'snow' },
  { id: 'cardio', label: 'Exercício Aeróbico', desc: 'Melhore sua resistência e saúde.', icon: 'lightning' },
  { id: 'journaling', label: 'Journaling', desc: 'Organize seus pensamentos no papel.', icon: 'pencil' },
  { id: 'detox_digital', label: 'Jejum de Telas', desc: 'Desconecte para reconectar-se.', icon: 'phone-off' },
  { id: 'natureza', label: 'Caminhada/Ar Livre', desc: 'Reduza o estresse ao ar livre.', icon: 'tree' },
  { id: 'sono', label: 'Higiene do Sono', desc: 'Prepare-se para um descanso reparador.', icon: 'moon' },
  { id: 'habilidade', label: 'Nova Habilidade', desc: 'Aprenda algo novo todos os dias.', icon: 'academic' },
  { id: 'voluntario', label: 'Fazer o Bem', desc: 'Ajude o próximo e sinta gratidão.', icon: 'heart' },
  { id: 'social', label: 'Socialização Real', desc: 'Conexões presenciais importam.', icon: 'chat' },
  { id: 'sol', label: 'Sol Matinal', desc: 'Regule seu ciclo circadiano.', icon: 'sun' },
  { id: 'respiracao', label: 'Breathwork', desc: 'Controle a ansiedade pela resciração.', icon: 'wind' },
  { id: 'criativo', label: 'Hobby Criativo', desc: 'Expressão criativa longe de telas.', icon: 'color-swatch' }
];

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}
