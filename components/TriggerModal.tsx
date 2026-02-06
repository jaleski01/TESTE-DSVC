
import React, { useState } from 'react';
import { logTrigger } from '../services/triggerService';
import { fetchAndCacheProgressData } from '../services/progressService';
import { auth } from '../lib/firebase';
import { COLORS } from '../types';
import { Button } from './Button';
import { EMOTIONS, CONTEXTS } from '../data/triggerConstants';

interface TriggerModalProps {
  onClose: () => void;
}

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
            <h2 className="text-lg font-bold text-white mb-4 text-center">O que você está sentindo?</h2>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setEmotion(item)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    emotion === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 hover:bg-[#374151]'
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
            <h2 className="text-lg font-bold text-white mb-4 text-center">O que disparou isso?</h2>
            <div className="grid grid-cols-2 gap-3">
              {CONTEXTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setContext(item)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    context === item 
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                      : 'bg-[#1F2937] border-[#374151] text-gray-400 hover:bg-[#374151]'
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
            <h2 className="text-lg font-bold text-white mb-2 text-center">Nível da Vontade</h2>
            <p className="text-xs text-gray-400 mb-8">1 = Controlável, 5 = Insuportável</p>
            
            <div className="w-full flex justify-between items-center px-2 mb-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setIntensity(val)}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition-all flex items-center justify-center border-2 ${
                    intensity === val 
                      ? 'bg-red-500 border-red-500 text-white scale-110 shadow-lg' 
                      : 'bg-transparent border-gray-700 text-gray-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="w-full h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-yellow-500 to-red-600 transition-all duration-300"
                 style={{ width: `${(intensity / 5) * 100}%` }}
               />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-[#0F0A15] border border-[#2E243D] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
        <div className="w-full h-1 bg-[#2E243D]">
          <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <div className="p-6 flex-1 overflow-y-auto">{renderStepContent()}</div>
        <div className="p-4 border-t border-[#2E243D]">
          {step < 3 ? (
            <Button onClick={handleNext} disabled={(step === 1 && !emotion) || (step === 2 && !context)}>Próximo</Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-red-600 border-none">Registrar Gatilho</Button>
          )}
        </div>
      </div>
    </div>
  );
};
