
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
      // Se for "Dia Limpo" (ambos null), pula esta etapa para manter os logs puros.
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

  const variants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  const renderContent = () => {
    switch (step) {
      case 'RELAPSE_Q':
        return (
          <motion.div key="relapse" variants={variants} initial="enter" animate="center" exit="exit" className="text-center">
            <h2 className="text-xl font-black text-white mb-2 uppercase italic">Honestidade Radical</h2>
            <p className="text-gray-400 text-sm mb-8">Sua integridade vale mais que um número. Você venceu hoje?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleRelapseChoice(false)}
                className="w-full py-5 rounded-xl bg-violet-600 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 transition-all"
              >
                Sim, Eu Venci
              </button>
              <button 
                onClick={() => handleRelapseChoice(true)}
                className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-bold bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all"
              >
                Não, eu recaí
              </button>
            </div>
          </motion.div>
        );

      case 'EMOTION':
        return (
          <motion.div key="emotion" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-white mb-1 text-center">Diagnóstico Emocional</h2>
            <p className="text-xs text-gray-500 text-center mb-4">Como você se sentiu predominantemente hoje?</p>
            
            {/* Opção de Check-in Limpo (Apenas se não for recaída) */}
            {!isRelapse && (
              <button
                onClick={handleCleanCheckIn}
                className="w-full mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0"
              >
                <ShieldCheck size={20} />
                Dia Limpo - Sem Gatilhos
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto scrollbar-hide flex-1">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setEmotion(item)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    emotion === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                      : 'border-[#374151] bg-[#1F2937] text-gray-400 active:scale-95'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            
            <Button 
              onClick={() => setStep('CONTEXT')} 
              disabled={!emotion}
              className="mt-auto"
            >
              Próximo
            </Button>
          </motion.div>
        );

      case 'CONTEXT':
        return (
          <motion.div key="context" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-white mb-1 text-center">Contexto</h2>
            <p className="text-xs text-gray-500 text-center mb-6">{isRelapse ? 'Onde você estava vulnerável?' : 'Onde você passou a maior parte do dia?'}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto scrollbar-hide flex-1">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setContext(item)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    context === item 
                      ? isRelapse 
                        ? 'bg-red-600/20 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                        : 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                      : 'border-[#374151] bg-[#1F2937] text-gray-400 active:scale-95'
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
              className={`mt-auto ${isRelapse ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'}`}
            >
              {isRelapse ? 'Confirmar Falha' : shouldShowEpitaph ? 'Próximo' : 'Confirmar Check-in'}
            </Button>
          </motion.div>
        );

      case 'EPITAPH_INPUT':
        return (
          <motion.div key="epitaph" variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Feather size={20} className="text-amber-500" />
              <h2 className="text-lg font-black text-white uppercase italic">Epitáfio do Dia</h2>
            </div>
            
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Hoje é um marco. Para confirmar sua vitória, registre brevemente o estado da sua mente e espírito. O que mudou?
            </p>

            <textarea
              value={epitaphText}
              onChange={(e) => setEpitaphText(e.target.value)}
              placeholder="Descreva detalhadamente como você se sente mental, física e socialmente..."
              className="flex-1 w-full bg-[#050505] border border-amber-500/30 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none text-sm mb-6 min-h-[120px]"
              autoFocus
            />

            <Button 
              onClick={finishVictory}
              disabled={!epitaphText.trim()}
              isLoading={isLoading}
              className={`w-full font-bold uppercase tracking-widest ${
                !epitaphText.trim() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              Confirmar Vitória
            </Button>
          </motion.div>
        );

      case 'SUCCESS_MSG':
        return (
          <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase mb-2">Vitória Confirmada!</h2>
            <p className="text-gray-400 text-sm">Mais um elo forjado na sua corrente de disciplina.</p>
          </motion.div>
        );

      case 'FAILURE_MSG':
        return (
          <motion.div key="failure" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase mb-2">Levante-se.</h2>
            <p className="text-gray-400 text-sm">A honestidade é o primeiro passo da volta. Recomeçando o protocolo...</p>
          </motion.div>
        );
      
      default: return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-fadeIn" />
      <div className="w-full max-w-sm bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-8 relative overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};
