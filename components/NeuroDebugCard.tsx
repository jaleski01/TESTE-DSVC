
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../types';
import { DEBUG_DATA } from '../data/neuroDebugData';

export const NeuroDebugCard: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<typeof DEBUG_DATA[0] | null>(null);
  const [step, setStep] = useState<'LIE' | 'TRUTH'>('LIE');

  const handleOpen = (item: typeof DEBUG_DATA[0]) => {
    // Haptic Feedback On Open
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    
    setSelectedItem(item);
    setStep('LIE');
  };

  const handleClose = () => {
    setSelectedItem(null);
    setStep('LIE');
  };

  const handleRevealTruth = () => {
    // Haptic Feedback On Reveal
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 50, 10]);
    
    setStep('TRUTH');
  };

  const handleFinish = () => {
    handleClose();
  };

  return (
    <div className="flex flex-col w-full my-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse"></div>
        <h3 
          className="text-[10px] font-bold uppercase tracking-widest opacity-80"
          style={{ color: COLORS.TextSecondary }}
        >
          Neuro-Debug (Gatilhos)
        </h3>
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full mb-5">
        {DEBUG_DATA.map((item) => (
          <button
            key={item.id}
            onClick={() => handleOpen(item)}
            className="w-[45%] py-4 px-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center shadow-sm relative overflow-hidden group"
            style={{ 
              backgroundColor: '#1F2937', 
              borderColor: '#374151',
            }}
          >
            {/* Subtle highlight on hover */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <span className="text-xs font-bold text-white tracking-wide text-center relative z-10">
              {item.trigger}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
              onClick={handleClose}
            />

            {/* Card Content */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300"
              style={{ 
                backgroundColor: COLORS.Surface,
                border: `1px solid ${step === 'TRUTH' ? '#10B981' : COLORS.Border}`,
                boxShadow: step === 'TRUTH' ? '0 0 30px rgba(16, 185, 129, 0.2)' : '0 0 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* --- SCANNER BEAM ANIMATION --- */}
              {step === 'LIE' && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent z-20 opacity-50 blur-[2px]"
                  initial={{ top: '-10%' }}
                  animate={{ top: '110%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.5, 
                    ease: "easeInOut",
                    repeatDelay: 0.5 
                  }}
                />
              )}

              {/* Header Stripe */}
              <div 
                className="h-1.5 w-full transition-colors duration-500"
                style={{ backgroundColor: step === 'TRUTH' ? '#10B981' : COLORS.Primary }}
              />

              <div className="p-6 relative z-10">
                {/* Trigger Title */}
                <h2 
                  className="text-center text-xs font-bold uppercase tracking-widest mb-6 transition-colors duration-300"
                  style={{ color: step === 'TRUTH' ? '#10B981' : COLORS.TextSecondary }}
                >
                  {step === 'LIE' ? `Detectado: ${selectedItem.trigger}` : 'VERDADE DESBLOQUEADA'}
                </h2>

                {step === 'LIE' ? (
                  // STATE 1: THE LIE
                  <div className="flex flex-col gap-6">
                    <p className="text-center text-lg font-medium text-white leading-relaxed">
                      "Qual mentira seu cérebro está contando agora?"
                    </p>
                    
                    <button
                      onClick={handleRevealTruth}
                      className="w-full p-4 rounded-xl border border-dashed border-gray-600 bg-gray-900/50 hover:bg-gray-800 transition-colors text-left group active:scale-[0.98]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-red-400 mt-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                        <span className="text-sm italic text-gray-300 group-hover:text-white transition-colors">
                          "{selectedItem.lie}"
                        </span>
                      </div>
                    </button>
                    
                    <p className="text-center text-[10px] text-gray-500 uppercase animate-pulse">
                      Toque na mentira para escanear a verdade
                    </p>
                  </div>
                ) : (
                  // STATE 2: THE TRUTH
                  <div className="flex flex-col gap-6">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#10B981]/10 p-4 rounded-xl border border-[#10B981]/30"
                     >
                       <p className="text-sm font-semibold leading-relaxed text-white">
                         "{selectedItem.truth}"
                       </p>
                     </motion.div>

                     <button
                      onClick={handleFinish}
                      className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#10B981' }}
                     >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       Entendi e desarmei
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
