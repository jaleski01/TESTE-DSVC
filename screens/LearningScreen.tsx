
import React, { useState, useEffect, useMemo } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS, UserProfile } from '../types';
import { LEARNING_MODULES, LearningModule, LearningStep } from '../data/learningModules';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const LearningScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const visibleModules = useMemo(() => {
    // Filtrar módulos normais + Recompensas Especiais resgatadas
    const claimed = profile?.claimed_rewards || [];
    
    const normalModules = LEARNING_MODULES.filter(m => !m.isSpecialReward);
    const claimedRewards = LEARNING_MODULES.filter(m => m.isSpecialReward && claimed.includes(m.id));

    // Recompensas em primeiro
    return [...claimedRewards, ...normalModules];
  }, [profile]);

  // --- ICONS ---
  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'mic':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'play':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Wrapper noPadding>
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-transparent">
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col">
          
          <div className="flex flex-col mb-6">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Base de Conhecimento
            </h1>
            <p className="text-xs" style={{ color: COLORS.TextSecondary }}>
              Neurociência, táticas e ferramentas de bloqueio.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {visibleModules.map((module) => {
              const isSpecial = module.isSpecialReward;

              return (
                <div
                  key={module.id}
                  className={`flex flex-col w-full p-4 rounded-xl border transition-all group relative overflow-hidden ${
                    isSpecial ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-[#1F2937]'
                  }`}
                  style={{
                    background: isSpecial 
                      ? 'linear-gradient(135deg, #451A03 0%, #000000 100%)' 
                      : `linear-gradient(135deg, ${module.gradientStart} 0%, ${module.gradientEnd} 100%)`,
                  }}
                >
                  <div className="flex items-center w-full">
                    <div 
                      className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-black/40 border mr-4 shadow-lg backdrop-blur-sm ${
                        isSpecial ? 'border-yellow-500/30' : 'border-white/5'
                      }`}
                    >
                      {getIcon(module.icon, module.accentColor)}
                    </div>

                    <div className="flex-1 text-left z-10 min-w-0">
                      <span 
                        className="text-[9px] font-bold uppercase tracking-widest mb-1 block opacity-80"
                        style={{ color: module.accentColor }}
                      >
                        {module.category} {isSpecial && '🔓'}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-tight mb-1 truncate">
                        {module.title}
                      </h3>
                      <p 
                        className="text-[11px] font-medium leading-snug truncate"
                        style={{ color: '#94A3B8' }}
                      >
                         {module.subtitle}
                      </p>
                    </div>

                    {!isSpecial && (
                       <button onClick={() => setSelectedModule(module)} className="opacity-30 group-hover:opacity-100 transition-opacity z-10 ml-2 flex-shrink-0">
                         <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </button>
                    )}
                  </div>

                  {isSpecial && module.videoUrl && (
                    <div className="mt-4 animate-fadeIn">
                       <iframe 
                        className="w-full aspect-video rounded-lg border border-yellow-500/30 shadow-inner"
                        src={module.videoUrl} 
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                      ></iframe>
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-[11px] text-yellow-200/80 leading-relaxed italic">
                          "O conhecimento é o único escudo que ninguém pode tirar de você. Esta masterclass é seu prêmio por manter a disciplina."
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PARA MÓDULOS NORMAIS */}
      {selectedModule && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-fadeIn">
           <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500">Documentação Técnica</span>
              <button onClick={() => setSelectedModule(null)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto scrollbar-hide">
             <h2 className="text-2xl font-black text-white mb-2 leading-tight">{selectedModule.title}</h2>
             <p className="text-gray-400 text-sm leading-relaxed mb-8">{selectedModule.intro}</p>
             
             {/* Conteúdo condicional (ex: passos do DNS) */}
             {selectedModule.id === 'dns_shield' && (
                <div className="space-y-6">
                   <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/30">
                      <p className="text-xs text-violet-300 font-bold mb-3 uppercase tracking-widest">Procedimento Recomendado</p>
                      <div className="space-y-4">
                        {selectedModule.androidSteps?.map((step, idx) => (
                           <div key={idx} className="flex gap-3">
                              <span className="text-xs font-mono text-violet-500">0{idx+1}</span>
                              <p className="text-xs text-gray-300">{step.text}</p>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
             )}
           </div>
           
           <div className="pt-6">
              <button onClick={() => setSelectedModule(null)} className="w-full py-4 rounded-xl bg-[#1A1A1A] border border-[#2E243D] text-xs font-bold uppercase tracking-widest text-white">Fechar Protocolo</button>
           </div>
        </div>
      )}
    </Wrapper>
  );
};
