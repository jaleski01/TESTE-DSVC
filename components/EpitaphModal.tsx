
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { COLORS } from '../types';
import { saveEpitaph } from '../services/epitaphService';
import { auth } from '../lib/firebase';

interface EpitaphModalProps {
  dayNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EpitaphModal: React.FC<EpitaphModalProps> = ({ dayNumber, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || !auth.currentUser) return;
    
    setIsLoading(true);
    try {
      await saveEpitaph(auth.currentUser.uid, content, dayNumber);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Feedback tátil diferente
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar epitáfio", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0F0A15] border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col"
      >
        {/* Header Dourado */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-wide">O Epitáfio • Dia {dayNumber}</h2>
            <p className="text-amber-500/80 text-xs font-bold tracking-widest uppercase">Registro de Evolução</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          Este é um marco. Fale com seu eu do futuro. Como está sua mente, corpo e espírito hoje? O que você venceu?
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva aqui sua reflexão..."
          className="w-full h-48 bg-[#050505] border border-[#2E243D] rounded-xl p-4 text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none resize-none mb-6 text-sm leading-relaxed"
          autoFocus
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-xl text-gray-500 font-bold hover:text-white transition-colors uppercase text-xs tracking-widest"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
            className={`flex-[2] py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]
              ${!content.trim() || isLoading 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]'
              }`}
          >
            {isLoading ? 'Gravando...' : 'Eternizar Registro'}
          </button>
        </div>

      </motion.div>
    </div>,
    document.body
  );
};
