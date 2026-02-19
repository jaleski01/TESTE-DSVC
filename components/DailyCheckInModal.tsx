
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS, UserProfile } from '../types';
import { Button } from './Button';
import { EMOTIONS, CONTEXTS } from '../data/triggerConstants';
import { logTrigger } from '../services/triggerService';
import { saveEpitaph } from '../services/epitaphService';
import { forceResetStreak, performDailyCheckIn } from '../services/gamificationService';
import { auth, db } from '../lib/firebase';
import { Feather, ShieldCheck } from 'lucide-react';

interface DailyCheckInModalProps {
  profile: UserProfile;
  isEpitaphDay: boolean;
  hasWrittenEpitaphToday: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: UserProfile) => void;
}

type CheckInStep = 'RELAPSE_Q' | 'EMOTION' | 'CONTEXT' | 'EPITAPH_INPUT' | 'SUCCESS_MSG' | 'FAILURE_MSG';

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({ 
  profile, 
  isEpitaphDay,
  hasWrittenEpitaphToday,
  onClose, 
  onSuccess 
}) => {
  const [step, setStep] = useState<CheckInStep>('RELAPSE_Q');
  const [isRelapse, setIsRelapse] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  
  // Epitáfio State
  const [epitaphText, setEpitaphText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const shouldShowEpitaph = !isRelapse && isEpitaphDay && !hasWrittenEpitaphToday;

  const handleRelapseChoice = (didRelapse: boolean) => {
    setIsRelapse(didRelapse);
    setStep('EMOTION'); // Sempre coleta emoção agora
  };

  const handleCleanCheckIn = () => {
    // Check-in Limpo: Define gatilhos como null para não salvar logs
    setEmotion(null);
    setContext(null);

    // Se for dia de Epitáfio, obriga a escrita mesmo sem gatilhos
    if (shouldShowEpitaph) {
      setStep('EPITAPH_INPUT');
    } else {
      finishVictory();
    }
  };

  const handleContextNext = () => {
    if (isRelapse) {
      finishRelapse();
    } else {
      if (shouldShowEpitaph) {
        setStep('EPITAPH_INPUT');
      } else {
        finishVictory();
      }
    }
  };

  const finishVictory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);

    try {
      const today = new Date().toLocaleDateString('en-CA');

      // 1. Lógica Condicional de Salvamento:
      // Só salva no histórico diário se houver emoção e contexto (Gatilhos identificados).
      if (emotion && context) {
        const historyRef = doc(db, "users", user.uid, "daily_history", today);
        await setDoc(historyRef, {
          date: today,
          checkin_emotion: emotion,
          checkin_context: context,
          last_updated: serverTimestamp()
        }, { merge: true });
      }

      // 2. Se houver epitáfio para salvar
      if (shouldShowEpitaph && epitaphText.trim()) {
        const streakForEpitaph = (profile.currentStreak || 0) + 1;
        await saveEpitaph(user.uid, epitaphText, streakForEpitaph);
      }

      // 3. Realiza o Check-in de Ofensiva (Sempre ocorre, mesmo em dia limpo)
      const result = await performDailyCheckIn(user.uid, profile);
      
      if (result && result.success) {
        setStep('SUCCESS_MSG');
        setTimeout(() => {
          onSuccess({
            ...profile,
            currentStreak: result.newStreak,
            lastCheckInDate: today,
            last_epitaph_date: shouldShowEpitaph ? today : profile.last_epitaph_date,
            unlockedAchievements: [
              ...(profile.unlockedAchievements || []),
              ...(result?.newAchievements?.map((a: any) => a.id) || [])
            ]
          });
          onClose();
        }, 2500);
      }
    } catch (error) {
      console.error("Victory error:", error);
      alert("Erro ao salvar progresso.");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const finishRelapse = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);

    try {
      // Loga o gatilho com intensidade 5 (padrão para recaída rápida)
      await logTrigger(user.uid, emotion!, context!, 5, 'relapse');
      
      const nowISO = new Date().toISOString();
      const updateData = await forceResetStreak(user.uid);

      await updateDoc(doc(db, "users", user.uid), {
        current_streak_start: nowISO
      });

      setStep('FAILURE_MSG');
      setTimeout(() => {
        onSuccess({ 
          ...profile, 
          ...updateData,
          current_streak_start: nowISO 
        });
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Relapse error:", error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      {/* Backdrop overlay com desfoque nativo para profundidade */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Container: Glassmorphism Premium */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-sm relative overflow-hidden rounded-[2rem] p-8 flex flex-col items-center text-center transition-all duration-500
          bg-[#0F0A15]/70 backdrop-blur-2xl border
          ${isEpitaphDay 
            ? 'border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]' 
            : 'border-violet-500/30 shadow-[0_0_60px_rgba(139,92,246,0.15)]'
          }
        `}
      >
        {/* Efeito Glow de Fundo Interno (Sutil) */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-50 pointer-events-none
          ${isEpitaphDay ? 'bg-amber-600' : 'bg-violet-600'}
        `} />

        {/* Ícone Dinâmico */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative z-10 border
          ${isEpitaphDay 
            ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] text-amber-400' 
            : 'bg-violet-500/10 border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.2)] text-violet-400'
          }
        `}>
          {isEpitaphDay ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Textos da Interface */}
        <div className="relative z-10 mb-8 w-full">
          <h2 className={`text-xl font-black uppercase tracking-wide mb-2
            ${isEpitaphDay ? 'text-amber-100' : 'text-white'}
          `}>
            {isEpitaphDay ? 'Marco de Evolução' : 'Consolidar Ofensiva'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed px-2 font-medium">
            {isEpitaphDay && !hasWrittenEpitaphToday 
              ? 'Hoje é dia de registrar o seu legado no Epitáfio. Confirme sua ofensiva e eternize sua mente.'
              : 'Você está no controle. Confirme para selar seu compromisso de hoje.'}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col w-full gap-3 relative z-10">
          <button 
            onClick={finishVictory} 
            disabled={isLoading}    
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98]
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              ${isEpitaphDay 
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]' 
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]'
              }
            `}
          >
            {isLoading ? 'Processando...' : 'Confirmar Dia'}
          </button>
          
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-4 rounded-xl text-gray-500 font-bold hover:text-white transition-colors uppercase text-xs tracking-widest"
          >
            Agora Não
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
