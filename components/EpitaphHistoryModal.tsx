
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EpitaphLog } from '../types';
import { getEpitaphHistory, fetchEvolutionInsight } from '../services/epitaphService';
import { auth } from '../lib/firebase';
import { Lock, Brain, Zap, X, ChevronRight } from 'lucide-react';

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

        // LÓGICA DE PERFORMANCE E GAMIFICAÇÃO:
        // Só aciona a Inteligência Artificial se houver dados suficientes (>= 3 logs).
        // Isso economiza tokens e cria um objetivo gamificado para o usuário.
        if (history.length >= 3) {
          setLoadingAI(true);
          const aiText = await fetchEvolutionInsight(history);
          setInsight(aiText);
          setLoadingAI(false);
        }
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
        setLoadingLogs(false);
        setLoadingAI(false);
      }
    };

    loadData();
  }, []);

  // Calcula porcentagem para a barra de progresso (Trava em 100%)
  const progressPercentage = Math.min((logs.length / 3) * 100, 100);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg h-[85vh] bg-[#0F0A15] border border-[#2E243D] rounded-3xl p-0 relative overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2E243D] flex justify-between items-center bg-[#15101a] shrink-0">
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-wide">Arquivos do Epitáfio</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{logs.length} Registros Totais</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* --- BLOCO DE INSIGHT DA IA (CONDICIONAL) --- */}
          
          {loadingLogs ? (
             // Estado de Carregamento Inicial
             <div className="w-full h-32 rounded-2xl bg-white/5 animate-pulse mb-8 border border-white/5" />
          ) : logs.length < 3 ? (
            // ESTADO BLOQUEADO (GAMIFICAÇÃO)
            <div className="mb-8 p-6 rounded-2xl bg-zinc-900/50 border border-white/10 relative overflow-hidden group">
               {/* Fundo com ruído sutil */}
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
               
               <div className="flex items-start gap-4 mb-5 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                   <Lock size={18} className="text-gray-500" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                     Análise Neural Bloqueada
                   </h3>
                   <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[250px]">
                     A IA precisa de mais dados para traçar seu perfil psicológico. Complete 3 Epitáfios (Dia 21) para desbloquear.
                   </p>
                 </div>
               </div>

               {/* Barra de Progresso */}
               <div className="relative z-10">
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-[10px] font-mono text-gray-600 uppercase">Coleta de Dados</span>
                   <span className="text-[10px] font-mono font-bold text-amber-600">{logs.length} / 3</span>
                 </div>
                 <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progressPercentage}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-gradient-to-r from-amber-900 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                   />
                 </div>
               </div>
            </div>
          ) : (
            // ESTADO DESBLOQUEADO (INSIGHT GERADO OU CARREGANDO)
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-black border border-amber-500/20 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                 {loadingAI ? (
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                 ) : (
                    <Brain size={16} className="text-amber-500" />
                 )}
                 <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex-1">
                   {loadingAI ? 'Processando Neuro-Dados...' : 'Análise de Inteligência'}
                 </h3>
                 {!loadingAI && <Zap size={14} className="text-amber-400 fill-amber-400" />}
               </div>
               
               {loadingAI ? (
                 <div className="space-y-3 animate-pulse">
                   <div className="h-2 bg-amber-500/10 rounded w-full"></div>
                   <div className="h-2 bg-amber-500/10 rounded w-5/6"></div>
                   <div className="h-2 bg-amber-500/10 rounded w-4/6"></div>
                 </div>
               ) : (
                 <div className="text-sm text-gray-300 leading-relaxed font-medium markdown-content space-y-3">
                   {/* Renderização limpa do insight */}
                   {insight?.split('\n').map((line, i) => (
                     line.trim() && (
                       <div key={i} className="flex gap-3 items-start">
                         <span className="text-amber-500/50 mt-1.5">•</span>
                         <p>{line.replace(/•|-|\*/g, '').trim()}</p>
                       </div>
                     )
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* Timeline de Logs */}
          <div className="relative border-l border-[#2E243D] ml-3 pl-8 pb-10 space-y-8">
            {loadingLogs ? (
               // Skeleton Loading para a lista
               [1, 2].map((i) => (
                 <div key={i} className="relative animate-pulse">
                   <div className="absolute -left-[37px] top-1 w-3 h-3 rounded-full bg-[#1A1A1A] border border-gray-700"></div>
                   <div className="h-4 bg-gray-800 rounded w-24 mb-3"></div>
                   <div className="h-20 bg-gray-900/50 rounded-xl border border-gray-800"></div>
                 </div>
               ))
            ) : logs.length === 0 ? (
              <div className="py-10 text-center opacity-40">
                <p className="text-sm font-bold text-gray-400">Nenhum registro encontrado.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[37px] top-1.5 w-3 h-3 rounded-full border transition-all duration-300 z-10
                    ${index === 0 ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#0F0A15] border-gray-600 group-hover:border-amber-500'}
                  `}></div>
                  
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-black ${index === 0 ? 'text-white' : 'text-gray-400'}`}>DIA {log.day_number}</span>
                      <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{log.date}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#15101a] border border-[#2E243D] group-hover:border-amber-500/20 transition-colors">
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {log.content}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </div>
      </motion.div>
    </div>,
    document.body
  );
};
