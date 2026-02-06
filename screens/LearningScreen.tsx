import React, { useState, useEffect } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS, UserProfile } from '../types';
import { LEARNING_MODULES, LearningModule } from '../data/learningModules';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export const LearningScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [showFutureMilestones, setShowFutureMilestones] = useState(false);

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

  const initialModules = LEARNING_MODULES.filter(m => !m.requiredStreak || m.requiredStreak <= 3);
  const futureMilestones = LEARNING_MODULES.filter(m => m.requiredStreak && m.requiredStreak > 3);

  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'shield':
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
      case 'document':
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'mic':
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
      case 'play':
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'lock':
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
      default:
        return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const handleModuleClick = (module: LearningModule, isLocked: boolean) => {
    if (isLocked) {
      if (navigator.vibrate) navigator.vibrate(100);
      return;
    }
    setSelectedModule(module);
  };

  const renderModuleCard = (module: LearningModule) => {
    const currentStreak = profile?.currentStreak || 0;
    const isLocked = !!module.requiredStreak && currentStreak < module.requiredStreak;
    const isSpecial = module.isSpecialReward;

    return (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleModuleClick(module, isLocked)}
        className={`
          flex flex-col w-full p-4 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer
          ${isLocked ? 'border-gray-800/50 grayscale' : 'border-[#1F2937] hover:border-white/20'}
          ${isSpecial && !isLocked ? 'shadow-[0_0_30px_rgba(234,179,8,0.15)]' : ''}
        `}
        style={{
          background: isLocked 
            ? `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)`
            : `linear-gradient(135deg, ${module.gradientStart} 0%, ${module.gradientEnd} 100%)`,
        }}
      >
        <div className={`flex items-center w-full transition-all duration-500 ${isLocked ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
          <div 
            className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-black/40 border mr-4 shadow-lg backdrop-blur-sm ${
              isSpecial ? 'border-yellow-500/30' : 'border-white/5'
            }`}
          >
            {getIcon(isLocked ? 'lock' : module.icon, isLocked ? '#4B5563' : module.accentColor)}
          </div>

          <div className="flex-1 text-left z-10 min-w-0">
            <span 
              className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 block opacity-80"
              style={{ color: module.accentColor }}
            >
              {module.category}
            </span>
            <h3 className="text-base font-black text-white leading-none mb-1.5 truncate italic">
              {module.title}
            </h3>
            <p className="text-xs font-bold text-gray-400 truncate tracking-tight">
               {module.subtitle}
            </p>
          </div>

          {!isSpecial && !isLocked && (
             <div className="opacity-30 group-hover:opacity-100 transition-opacity z-10 ml-2 flex-shrink-0">
               <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
               </svg>
             </div>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
             <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-2 shadow-2xl">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </div>
             <span 
              className="text-[10px] font-black uppercase tracking-[0.2em] py-1 px-4 rounded-full border border-white/10 bg-black/60 text-center"
              style={{ color: module.accentColor }}
             >
               Desbloqueado no {module.requiredStreak}º dia de ofensiva
             </span>
          </div>
        )}

        {isSpecial && !isLocked && (
          <div 
            className="absolute -right-2 -top-2 w-16 h-16 rounded-full blur-2xl opacity-30 animate-pulse pointer-events-none"
            style={{ backgroundColor: module.accentColor }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <Wrapper noPadding>
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-transparent">
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col">
          
          <div className="flex flex-col mb-8">
            <h1 className="text-xl font-bold text-white tracking-wide uppercase italic">
              Base de Dados
            </h1>
            <p className="text-xs font-bold tracking-widest" style={{ color: COLORS.TextSecondary }}>
              PROTOCOLO DE DESENSIIBILIZAÇÃO
            </p>
          </div>

          <div className="flex flex-col gap-5 w-full">
            {/* Renderiza Módulos Iniciais */}
            {initialModules.map(renderModuleCard)}

            {/* Divisor / Botão de Expansão para Futuros Marcos */}
            {futureMilestones.length > 0 && (
              <div className="flex flex-col gap-5 mt-4">
                <button
                  onClick={() => setShowFutureMilestones(!showFutureMilestones)}
                  className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showFutureMilestones ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      {showFutureMilestones ? 'Ocultar metas de longo prazo' : 'Ver metas de longo prazo'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {!showFutureMilestones && futureMilestones.slice(0, 3).map((m, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                    ))}
                  </div>
                </button>

                <AnimatePresence>
                  {showFutureMilestones && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-5 overflow-hidden"
                    >
                      {futureMilestones.map(renderModuleCard)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedModule && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 overflow-hidden"
          >
             <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-600">INFORMAÇÃO TÁTICA</span>
                <button 
                  onClick={() => setSelectedModule(null)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide">
               <h2 className="text-3xl font-black text-white mb-4 leading-none italic uppercase tracking-tighter">{selectedModule.title}</h2>
               <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">{selectedModule.intro}</p>
               
               {selectedModule.videoUrl ? (
                  <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-10">
                    <iframe 
                      className="w-full h-full"
                      src={selectedModule.videoUrl} 
                      title="Video Player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
               ) : null}

               {selectedModule.id === 'dns_shield' && (
                  <div className="space-y-8">
                     <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-black text-violet-400 mb-6 uppercase tracking-widest">Configuração Android</h4>
                        <div className="space-y-6">
                          {selectedModule.androidSteps?.map((step, idx) => (
                             <div key={idx} className="flex gap-4">
                                <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">0{idx+1}</span>
                                <p className="text-xs text-gray-300 font-bold leading-relaxed">{step.text}</p>
                             </div>
                          ))}
                        </div>
                     </div>
                  </div>
               )}
             </div>
             
             <div className="pt-6">
                <button 
                  onClick={() => setSelectedModule(null)} 
                  className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-colors"
                >
                  Fechar Protocolo
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};