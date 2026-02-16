import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { logTrigger } from '../services/triggerService';
import { fetchAndCacheProgressData } from '../services/progressService';
import { auth } from '../lib/firebase';
import { COLORS } from '../types';
import { Button } from './Button';
import { EMOTIONS, CONTEXTS } from '../data/triggerConstants';

interface TriggerModalProps {
  onClose: () => void;
}

/**
 * TriggerModal - Versão Otimizada (Senior Frontend)
 * 1. Usa React Portal para escapar de restrições de overflow/z-index do iOS.
 * 2. Barra de progresso com transição CSS fluida.
 * 3. Suporte nativo a Safe Areas para dispositivos móveis modernos.
 */
export const TriggerModal: React.FC<TriggerModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = () => {
    const user = auth.currentUser;
    if (!user || !emotion || !context) return;
    
    onClose();

    // Lógica de negócio preservada
    logTrigger(user.uid, emotion, context, intensity, 'urgency')
      .then(() => {
        return Promise.all([
          fetchAndCacheProgressData(7),
          fetchAndCacheProgressData(30)
        ]);
      })
      .catch((error) => {
        console.error("Background trigger sync failed:", error);
      });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-black text-white mb-4 text-center uppercase italic tracking-tight">O que você está sentindo?</h2>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setEmotion(item)}
                  className={`p-4 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    emotion === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)] scale-[1.02]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 active:scale-95'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-black text-white mb-4 text-center uppercase italic tracking-tight">O que disparou isso?</h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setContext(item)}
                  className={`p-4 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    context === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)] scale-[1.02]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 active:scale-95'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fadeIn flex flex-col items-center">
            <h2 className="text-xl font-black text-white mb-2 text-center uppercase italic tracking-tight">Nível da Vontade</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-10">1 = Controlável • 5 = Insuportável</p>
            
            <div className="w-full flex justify-between items-center px-2 mb-8">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setIntensity(val)}
                  className={`w-12 h-12 rounded-full font-black text-lg transition-all flex items-center justify-center border-2 ${
                    intensity === val 
                      ? 'bg-red-500 border-red-400 text-white scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                      : 'bg-[#1A1A1A] border-gray-800 text-gray-600'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="w-full h-1.5 bg-gray-900 rounded-full mt-4 overflow-hidden border border-white/5">
               <div 
                 className="h-full bg-gradient-to-r from-yellow-500 to-red-600 transition-all duration-700 ease-out"
                 style={{ width: `${(intensity / 5) * 100}%` }}
               />
            </div>
          </div>
        );
      default: return null;
    }
  };

  // Uso de createPortal para garantir que o modal fique no nível raiz do body
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5">
      {/* Backdrop com Blur Profundo */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="w-full max-w-sm bg-[#0F0A15] border border-[#2E243D] rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col animate-page-transition">
        
        {/* Barra de Progresso Fluida (Step Indicators) */}
        <div className="w-full h-1.5 bg-[#1C2533] relative">
          <div 
            className="h-full bg-violet-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {/* Header Decoração */}
        <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
          <svg className="w-12 h-12 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="p-8 flex-1 overflow-y-auto min-h-[320px] flex flex-col justify-center">
          {renderStepContent()}
        </div>

        {/* Rodapé com Safe Area para iOS */}
        <div className="p-5 border-t border-[#2E243D] bg-black/20 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {step < 3 ? (
            <Button 
              onClick={handleNext} 
              disabled={(step === 1 && !emotion) || (step === 2 && !context)}
              className="h-14 text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
            >
              Continuar Protocolo
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-red-600 border-none h-14 text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 transition-transform"
            >
              Documentar Gatilho
            </Button>
          )}
          
          <button 
            onClick={onClose}
            className="w-full mt-4 text-[10px] font-bold text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-[0.2em]"
          >
            Abortar Registro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};