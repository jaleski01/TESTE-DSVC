
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
import { Feather, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface DailyCheckInModalProps {
  profile: UserProfile;
  isEpitaphDay: boolean;
  hasWrittenEpitaphToday: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: UserProfile) => void;
}

type CheckInStep = 'RELAPSE_Q' | 'EMOTION' | 'CONTEXT' | 'EPITAPH_INPUT' | 'SUCCESS_MSG' | 'FAILURE_MSG';

/**
 * DailyCheckInModal - Versão Refatorada (Premium UI/UX)
 * Implementa Glassmorphism, desfoque profundo e feedback visual Neon.
 * Estritamente mantém a lógica de negócio original.
 */
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
  
  const [epitaphText, setEpitaphText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const shouldShowEpitaph = !isRelapse && isEpitaphDay && !hasWrittenEpitaphToday;

  const handleRelapseChoice = (didRelapse: boolean) => {
    setIsRelapse(didRelapse);
    setStep('EMOTION');
  };

  const handleCleanCheckIn = () => {
    setEmotion(null);
    setContext(null);
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

      if (emotion && context) {
        const historyRef = doc(db, "users", user.uid, "daily_history", today);
        await setDoc(historyRef, {
          date: today,
          checkin_emotion: emotion,
          checkin_context: context,
          last_updated: serverTimestamp()
        }, { merge: true });
      }

      if (shouldShowEpitaph && epitaphText.trim()) {
        const streakForEpitaph = (profile.currentStreak || 0) + 1;
        await saveEpitaph(user.uid, epitaphText, streakForEpitaph);
      }

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

  const variants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 }
  };

  const renderContent = () => {
    switch (step) {
      case 'RELAPSE_Q':
        return (
          <motion.div key="relapse" variants={variants} initial="enter" animate="center" exit="exit" className="text-center">
            <h2 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter text-glow">Honestidade Radical</h2>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">Sua integridade vale mais que um número.<br/>Você dominou seus impulsos hoje?</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleRelapseChoice(false)}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] active:scale-[0.98] transition-all duration-300 border border-white/10"
              >
                Sim, Eu Venci
              </button>
              <button 
                onClick={() => handleRelapseChoice(true)}
                className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500/80 font-bold bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-xs"
              >
                Não, eu recaí
              </button>
            </div>
          </motion.div>
        );

      case 'EMOTION':
        return (
          <motion.div key="emotion" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <h2 className="text-xl font-black text-white mb-1 text-center italic tracking-tighter text-glow">Diagnóstico Emocional</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] text-center mb-6">Estado Predominante</p>
            
            {!isRelapse && (
              <button
                onClick={handleCleanCheckIn}
                className="w-full mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500/10 active:scale-[0.98] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0"
              >
                <ShieldCheck size={20} className="text-emerald-500" />
                Dia Limpo
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 mb-8 overflow-y-auto scrollbar-hide flex-1 px-1">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setEmotion(item)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 active:scale-[0.96] text-sm font-black uppercase tracking-tight ${
                    emotion === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                      : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            
            <Button 
              onClick={() => setStep('CONTEXT')} 
              disabled={!emotion}
              className="mt-auto h-14 shadow-lg shadow-violet-900/20 uppercase tracking-widest font-black"
            >
              Próximo
            </Button>
          </motion.div>
        );

      case 'CONTEXT':
        return (
          <motion.div key="context" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <h2 className="text-xl font-black text-white mb-1 text-center italic tracking-tighter text-glow">Arquitetura da Resiliência</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] text-center mb-8">Contexto de Vulnerabilidade</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8 overflow-y-auto scrollbar-hide flex-1 px-1">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setContext(item)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 active:scale-[0.96] text-sm font-black uppercase tracking-tight ${
                    context === item 
                      ? isRelapse 
                        ? 'bg-red-600/20 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                        : 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                      : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button 
              onClick={handleContextNext} 
              disabled={!context} 
              isLoading={isLoading}
              className={`mt-auto h-14 uppercase tracking-widest font-black ${isRelapse ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-900/20'}`}
            >
              {isRelapse ? 'Confirmar Falha' : shouldShowEpitaph ? 'Próximo' : 'Finalizar Check-in'}
            </Button>
          </motion.div>
        );

      case 'EPITAPH_INPUT':
        return (
          <motion.div key="epitaph" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Feather size={24} className="text-amber-500" />
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter text-glow">O Epitáfio</h2>
            </div>
            
            <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium text-center">
              Este é um marco tático na sua evolução.<br/>Registre o estado da sua mente e espírito para a posteridade.
            </p>

            <textarea
              value={epitaphText}
              onChange={(e) => setEpitaphText(e.target.value)}
              placeholder="Descreva detalhadamente como você se sente mental, física e socialmente..."
              className="flex-1 w-full bg-black/30 border border-amber-500/20 rounded-2xl p-5 text-white placeholder-gray-700 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300 resize-none text-sm mb-8 leading-relaxed font-medium"
              autoFocus
            />

            <Button 
              onClick={finishVictory}
              disabled={!epitaphText.trim()}
              isLoading={isLoading}
              className={`h-16 w-full font-black uppercase tracking-widest text-sm ${
                !epitaphText.trim() 
                  ? 'opacity-40 cursor-not-allowed grayscale' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all'
              }`}
            >
              Eternizar Vitória
            </Button>
          </motion.div>
        );

      case 'SUCCESS_MSG':
        return (
          <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 text-glow">Protocolo Honrado</h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">Sua ofensiva foi forjada em aço.<br/>Continue vigilante, soldado.</p>
          </motion.div>
        );

      case 'FAILURE_MSG':
        return (
          <motion.div key="failure" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 flex flex-col items-center">
            <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mb-8 border border-red-600/40 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
              <AlertCircle size={48} className="text-red-600" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 text-glow">Levante a Cabeça</h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">A honestidade é a semente do recomeço.<br/>Resetando parâmetros de ofensiva...</p>
          </motion.div>
        );
      
      default: return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 sm:p-4">
      {/* Backdrop Profundo e Translúcido */}
      <div 
        className="absolute inset-0 bg-void/70 backdrop-blur-xl animate-fadeIn" 
        onClick={onClose} 
      />
      
      {/* Card Principal - Glassmorphism Estilo DSVC */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="w-full max-w-sm bg-glass-surface border border-glass-border rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.1)] backdrop-blur-3xl min-h-[440px] flex flex-col justify-center"
      >
        {/* Glow de Background Interno */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none" />

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
};
