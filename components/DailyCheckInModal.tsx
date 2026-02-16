
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { COLORS, UserProfile } from '../types';
import { Button } from './Button';
import { EMOTIONS, CONTEXTS } from '../data/triggerConstants';
import { logTrigger } from '../services/triggerService';
import { forceResetStreak, performDailyCheckIn } from '../services/gamificationService';
import { auth, db } from '../lib/firebase';

interface DailyCheckInModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSuccess: (updatedProfile: UserProfile) => void;
}

type CheckInStep = 'RELAPSE_Q' | 'URGENCY_Q' | 'EMOTION' | 'CONTEXT' | 'INTENSITY' | 'SUCCESS_MSG' | 'FAILURE_MSG';

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({ profile, onClose, onSuccess }) => {
  const [step, setStep] = useState<CheckInStep>('RELAPSE_Q');
  const [isRelapse, setIsRelapse] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);

    try {
      if (isRelapse) {
        // Fluxo de Recaída
        await logTrigger(user.uid, emotion!, context!, intensity, 'relapse');
        
        // 1. Define o novo marco zero temporal
        const nowISO = new Date().toISOString();

        // 2. Reseta a contagem de dias (Lógica existente)
        const updateData = await forceResetStreak(user.uid);

        // 3. Atualiza explicitamente o timestamp de início no Firestore para reiniciar o cronômetro
        await updateDoc(doc(db, "users", user.uid), {
          current_streak_start: nowISO
        });

        setStep('FAILURE_MSG');
        setTimeout(() => {
          // 4. Passa os dados atualizados para o contexto local (Dashboard)
          onSuccess({ 
            ...profile, 
            ...updateData,
            current_streak_start: nowISO 
          });
          onClose();
        }, 3000);
      } else {
        // Fluxo de Vitória
        if (emotion && context) {
          await logTrigger(user.uid, emotion, context, intensity, 'urgency');
        }
        const result = await performDailyCheckIn(user.uid, profile);
        if (result && result.success) {
          setStep('SUCCESS_MSG');
          setTimeout(() => {
            onSuccess({
              ...profile,
              currentStreak: result.newStreak,
              lastCheckInDate: new Date().toLocaleDateString('en-CA'),
              unlockedAchievements: [
                ...(profile.unlockedAchievements || []),
                ...(result?.newAchievements?.map((a: any) => a.id) || [])
              ]
            });
            onClose();
          }, 2500);
        }
      }
    } catch (error) {
      console.error("Check-in error:", error);
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
            <h2 className="text-xl font-black text-white mb-2 uppercase italic">Seja honesto, guerreiro.</h2>
            <p className="text-gray-400 text-sm mb-8">Você manteve sua integridade e sobriedade hoje?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsRelapse(false); setStep('URGENCY_Q'); }}
                className="w-full py-4 rounded-xl bg-violet-600 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                SIM, EU VENCI
              </button>
              <button 
                onClick={() => { setIsRelapse(true); setStep('EMOTION'); }}
                className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-bold bg-red-500/10"
              >
                Não, eu recaí
              </button>
            </div>
          </motion.div>
        );

      case 'URGENCY_Q':
        return (
          <motion.div key="urgency" variants={variants} initial="enter" animate="center" exit="exit" className="text-center">
            <h2 className="text-xl font-black text-white mb-2 uppercase italic">Nível de Pressão</h2>
            <p className="text-gray-400 text-sm mb-8">Teve algum gatilho ou vontade forte de ceder hoje?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsRelapse(false); setStep('EMOTION'); }}
                className="w-full py-4 rounded-xl border border-violet-500/30 text-white font-bold bg-violet-500/10"
              >
                SIM, TIVE QUE LUTAR
              </button>
              <button 
                onClick={() => handleFinish()}
                className="w-full py-4 rounded-xl bg-[#0F0A15] border border-gray-800 text-gray-400 font-bold"
              >
                NÃO, FOI TRANQUILO
              </button>
            </div>
          </motion.div>
        );

      case 'EMOTION':
        return (
          <motion.div key="emotion" variants={variants} initial="enter" animate="center" exit="exit">
            <h2 className="text-lg font-bold text-white mb-4 text-center">O que {isRelapse ? 'causou a falha' : 'tentou te derrubar'}?</h2>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => { setEmotion(item); setStep('CONTEXT'); }}
                  className="p-3 rounded-xl border border-[#374151] bg-[#1F2937] text-gray-300 text-sm font-bold active:bg-violet-600 active:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'CONTEXT':
        return (
          <motion.div key="context" variants={variants} initial="enter" animate="center" exit="exit">
            <h2 className="text-lg font-bold text-white mb-4 text-center">Onde isso aconteceu?</h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => { setContext(item); setStep('INTENSITY'); }}
                  className="p-3 rounded-xl border border-[#374151] bg-[#1F2937] text-gray-300 text-sm font-bold active:bg-violet-600 active:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'INTENSITY':
        return (
          <motion.div key="intensity" variants={variants} initial="enter" animate="center" exit="exit" className="text-center">
            <h2 className="text-lg font-bold text-white mb-2">Intensidade da Vontade</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-10">De 1 (Leve) a 5 (Insuportável)</p>
            <div className="flex justify-between gap-2 mb-10">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setIntensity(v)}
                  className={`w-12 h-12 rounded-full font-black border-2 transition-all ${
                    intensity === v ? 'bg-violet-600 border-violet-400 text-white scale-110' : 'border-gray-800 text-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button isLoading={isLoading} onClick={handleFinish} className={isRelapse ? 'bg-red-600' : 'bg-green-600'}>
              {isRelapse ? 'Confirmar Recomeço' : 'Registrar Vitória'}
            </Button>
          </motion.div>
        );

      case 'SUCCESS_MSG':
        return (
          <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase mb-2">Guerreiro!</h2>
            <p className="text-gray-400 text-sm">Sua resiliência foi documentada. Mais um dia de domínio.</p>
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
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      <div className="w-full max-w-sm bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-8 relative overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};
