
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { EpitaphLog } from '../types';
import { getEpitaphHistory, fetchEvolutionInsight } from '../services/epitaphService';
import { auth } from '../lib/firebase';

interface EpitaphHistoryModalProps {
  onClose: () => void;
}

export const EpitaphHistoryModal: React.FC<EpitaphHistoryModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<EpitaphLog[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const history = await getEpitaphHistory(auth.currentUser.uid);
        setLogs(history);
        setLoadingLogs(false);

        // Se tiver pelo menos 3 registros, busca o insight da IA
        if (history.length >= 3) {
          setLoadingAI(true);
          // Tenta pegar do cache ou fetch novo (aqui simplificado para fetch sempre por enquanto)
          // Em prod: poderia salvar o insight no firestore para não gastar tokens
          const aiText = await fetchEvolutionInsight(history);
          setInsight(aiText);
        }
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      } finally {
        setLoadingLogs(false);
        setLoadingAI(false);
      }
    };

    loadData();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg h-[80vh] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-0 relative overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2E243D] flex justify-between items-center bg-[#15101a]">
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-wide">Arquivos do Epitáfio</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{logs.length} Registros</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* AI Insight Section */}
          {(loadingAI || insight) && (
            <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-amber-900/10 to-black border border-amber-500/30 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                 <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Análise de Inteligência</h3>
               </div>
               
               {loadingAI ? (
                 <div className="space-y-2 animate-pulse">
                   <div className="h-3 bg-amber-500/10 rounded w-3/4"></div>
                   <div className="h-3 bg-amber-500/10 rounded w-full"></div>
                   <div className="h-3 bg-amber-500/10 rounded w-5/6"></div>
                 </div>
               ) : (
                 <div className="text-sm text-gray-200 leading-relaxed font-medium markdown-content">
                   {/* Renderização simples de texto com quebras de linha */}
                   {insight?.split('\n').map((line, i) => (
                     <p key={i} className="mb-2 last:mb-0">{line}</p>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* Timeline */}
          {loadingLogs ? (
            <div className="text-center py-10">
               <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-xs text-gray-500 uppercase tracking-widest">Carregando Arquivos...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-sm font-bold text-gray-400">Nenhum registro encontrado.</p>
              <p className="text-xs text-gray-600 mt-2">Complete 7 dias de ofensiva para iniciar.</p>
            </div>
          ) : (
            <div className="space-y-6 relative border-l border-[#2E243D] ml-3 pl-6 pb-10">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#1A1A1A] border border-gray-600 group-hover:border-amber-500 group-hover:bg-amber-500/20 transition-colors"></div>
                  
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-sm font-black text-white">DIA {log.day_number}</span>
                    <span className="text-xs text-gray-500 font-mono">{log.date}</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#15101a] border border-[#2E243D] group-hover:border-amber-500/20 transition-colors">
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{log.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </motion.div>
    </div>,
    document.body
  );
};
