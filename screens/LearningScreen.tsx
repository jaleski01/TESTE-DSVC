
import React, { useState, useEffect } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS } from '../types';
import { LEARNING_MODULES, LearningModule } from '../data/learningModules';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Activity, Brain, ArrowLeft, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { NeuroDebugSwipe } from '../components/NeuroDebugSwipe';
import { REALITY_CHECK_DATA, RealityFact } from '../data/realityCheckData';
import { useData } from '../contexts/DataContext';
import { LearningSkeleton } from '../components/LearningSkeleton';

export const LearningScreen: React.FC = () => {
  const { userProfile: profile, loading } = useData();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [showFutureMilestones, setShowFutureMilestones] = useState(false);
  const [selectedDNS, setSelectedDNS] = useState<'ANDROID' | 'iOS'>('ANDROID');
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // NeuroDebug Swipe Logic States
  const [neuroIndex, setNeuroIndex] = useState(0);
  const [neuroFeedback, setNeuroFeedback] = useState<RealityFact | null>(null);
  const [neuroComplete, setNeuroComplete] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => setShowSkeleton(true), 150);
    } else {
      setShowSkeleton(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const currentStreak = profile?.currentStreak || 0;

  // Optimized Instant Calculation for filter
  const baseModules = LEARNING_MODULES.filter((m) => {
    if (!m.requiredStreak) return true;
    if (m.requiredStreak === 3) return true;
    return m.requiredStreak <= currentStreak;
  }).sort((a, b) => {
    const aIsReward = !!a.requiredStreak;
    const bIsReward = !!b.requiredStreak;
    if (aIsReward && bIsReward) return (a.requiredStreak || 0) - (b.requiredStreak || 0);
    if (aIsReward) return -1;
    if (bIsReward) return 1;
    return 0;
  });

  const futureModules = LEARNING_MODULES.filter((m) => {
    return (m.requiredStreak && m.requiredStreak > 3 && currentStreak < m.requiredStreak);
  });

  const getIcon = (icon: any, color: string) => {
    if (typeof icon !== 'string') {
      const IconComp = icon;
      return <IconComp className="w-6 h-6" color={color} strokeWidth={2} />;
    }
    switch (icon) {
      case 'shield': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
      case 'document': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'mic': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
      case 'play': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'lock': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
      default: return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const handleModuleClick = (module: LearningModule, isLocked: boolean) => {
    if (isLocked) {
      if (navigator.vibrate) navigator.vibrate(100);
      return;
    }
    // Reset NeuroDebug states when opening
    if (module.id === 'tool_neurodebug') {
      setNeuroIndex(0);
      setNeuroFeedback(null);
      setNeuroComplete(false);
    }
    setSelectedModule(module);
  };

  // NeuroDebug Swipe Handlers
  const handleNeuroSwipe = (direction: string) => {
    if (navigator.vibrate) navigator.vibrate(15);
    setNeuroFeedback(REALITY_CHECK_DATA[neuroIndex]);
  };

  const handleNextNeuro = () => {
    setNeuroFeedback(null);
    if (neuroIndex < REALITY_CHECK_DATA.length - 1) {
      setNeuroIndex(prev => prev + 1);
    } else {
      setNeuroComplete(true);
    }
  };

  const renderModuleCard = (module: LearningModule) => {
    // CRITICAL FIX: Instant calculation from current streak to avoid visual flickering
    const isLocked = !!module.requiredStreak && currentStreak < module.requiredStreak;
    const isUnlockedReward = !!module.requiredStreak && currentStreak >= module.requiredStreak;
    const isSpecial = module.isSpecialReward;

    const reward3DModule = LEARNING_MODULES.find(m => m.id === 'reward_3d');
    const RewardIcon = reward3DModule ? reward3DModule.icon : module.icon;
    const DisplayIcon = isUnlockedReward ? RewardIcon : module.icon;
    
    const cardColors = isUnlockedReward ? {
        start: '#451a03', // Deep Amber
        end: '#1a1a1a', 
        text: '#FFFFFF',
        accent: '#F59E0B' // Success Amber
    } : {
        start: module.colors?.start || module.gradientStart || '#000000',
        end: module.colors?.end || module.gradientEnd || '#1a1a1a',
        text: '#FFFFFF',
        accent: module.colors?.accent || module.accentColor || '#8B5CF6'
    };

    return (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleModuleClick(module, isLocked)}
        className={`flex flex-col w-full p-4 rounded-3xl border transition-all relative overflow-hidden group cursor-pointer ${
          isLocked ? 'border-gray-800/50 grayscale' : isUnlockedReward ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-[#1F2937] hover:border-white/20'
        }`}
        style={{ 
          background: isLocked 
            ? `linear-gradient(135deg, #0a0a0a 0%, #15101a 100%)` 
            : `linear-gradient(135deg, ${cardColors.start} 0%, ${cardColors.end} 100%)` 
        }}
      >
        <div className={`flex items-center w-full transition-all duration-500 ${isLocked ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
          <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-black/40 border mr-4 shadow-lg backdrop-blur-sm ${
            isUnlockedReward ? 'border-amber-500/30' : 'border-white/5'
          }`}>
            {getIcon(isLocked ? 'lock' : DisplayIcon, isLocked ? '#4B5563' : cardColors.accent)}
          </div>
          <div className="flex-1 text-left z-10 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 block opacity-80" style={{ color: cardColors.accent }}>{module.category}</span>
            <h3 className="text-base font-black leading-none mb-1.5 truncate italic" style={{ color: cardColors.text }}>{module.title}</h3>
            <p className={`text-xs truncate tracking-tight ${isUnlockedReward ? 'text-amber-200/70 font-semibold' : 'text-gray-400 font-bold'}`}>{module.subtitle}</p>
          </div>
          {!isLocked && (
             <div className="opacity-30 group-hover:opacity-100 transition-opacity z-10 ml-2 flex-shrink-0">
               <ChevronRight size={18} className={isUnlockedReward ? 'text-amber-500' : 'text-gray-500'} />
             </div>
          )}
        </div>
        
        {isLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
             <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-2 shadow-2xl">
                <Lock size={18} className="text-white/60" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] py-1 px-4 rounded-full border border-white/10 bg-black/60 text-center" style={{ color: cardColors.accent }}>
               Marco de {module.requiredStreak} Dias
             </span>
          </div>
        )}
      </motion.div>
    );
  };

  const ChevronRight = ({ size, className }: { size: number, className: string }) => (
    <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <Wrapper noPadding>
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-transparent">
        <div className="w-full max-full px-5 pt-6 pb-32 flex flex-col">
          <div className="flex flex-col mb-8">
            <h1 className="text-xl font-bold text-white tracking-wide uppercase italic">Base de Dados</h1>
            <p className="text-xs font-bold tracking-widest" style={{ color: COLORS.TextSecondary }}>PROTOCOLO DE DESENSIIBILIZAÇÃO</p>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              showSkeleton ? (
                <motion.div 
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LearningSkeleton />
                </motion.div>
              ) : null
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5 w-full"
              >
                {baseModules.map(renderModuleCard)}
                
                {futureModules.length > 0 && (
                  <div className="flex flex-col gap-5 mt-4">
                    <button 
                      onClick={() => setShowFutureMilestones(!showFutureMilestones)} 
                      className="w-full py-4 px-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showFutureMilestones ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          {showFutureMilestones ? 'Ocultar metas de longo prazo' : 'Ver metas de longo prazo'}
                        </span>
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
                          {futureModules.map(renderModuleCard)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedModule && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-600">INFORMAÇÃO TÁTICA</span>
                <button onClick={() => setSelectedModule(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide">
               {selectedModule.id !== 'tool_neurodebug' && (
                 <>
                   <h2 className="text-3xl font-black text-white mb-4 leading-none italic uppercase tracking-tighter">{selectedModule.title}</h2>
                   <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">{selectedModule.intro}</p>
                 </>
               )}

               {/* RE-ARCHITECTED NEURODEBUG INTERFACE (SWIPE CLONE) */}
               {selectedModule.id === 'tool_neurodebug' && (
                 <div className="flex flex-col items-center h-full">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">NeuroDebug</h2>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Sessão de Calibração Química</p>
                    </div>

                    <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
                      {neuroComplete ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          className="flex flex-col items-center text-center p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl"
                        >
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30">
                            <CheckCircle size={40} className="text-emerald-500" />
                          </div>
                          <h3 className="text-xl font-black text-white italic uppercase mb-2">Clareza Restaurada</h3>
                          <p className="text-sm text-gray-400 mb-8 max-w-[250px]">Você decodificou as mentiras do seu sistema límbico. Mantenha o córtex no comando.</p>
                          <button onClick={() => setSelectedModule(null)} className="py-4 px-10 bg-emerald-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg">Fechar Sessão</button>
                        </motion.div>
                      ) : neuroFeedback ? (
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }} 
                          animate={{ y: 0, opacity: 1 }} 
                          className={`w-full max-w-[320px] p-8 rounded-3xl backdrop-blur-md border ${
                            neuroFeedback.isTrue 
                              ? 'bg-[#10B981]/5 border-[#10B981]/20' 
                              : 'bg-[#F43F5E]/5 border-[#F43F5E]/20'
                          }`}
                        >
                          <div className={`flex items-center gap-2 mb-4 ${neuroFeedback.isTrue ? 'text-emerald-400' : 'text-rose-500'}`}>
                             {neuroFeedback.isTrue ? <Brain size={20} /> : <AlertTriangle size={20} />}
                             <h4 className="text-lg font-black italic uppercase tracking-tight">Verdade Descoberta</h4>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed font-medium mb-8">
                             {neuroFeedback.explanation}
                          </p>
                          <div className="flex items-center gap-2 mb-6 opacity-60">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${neuroFeedback.isTrue ? 'text-emerald-500' : 'text-rose-500'}`}>Fonte: {neuroFeedback.source}</span>
                          </div>
                          <button 
                            onClick={handleNextNeuro} 
                            className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                              neuroFeedback.isTrue ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                          >
                             Continuar Análise <ArrowLeft className="rotate-180" size={16} />
                          </button>
                        </motion.div>
                      ) : (
                        <NeuroDebugSwipe 
                          key={neuroIndex} 
                          item={REALITY_CHECK_DATA[neuroIndex]} 
                          onSwipe={handleNeuroSwipe} 
                        />
                      )}
                    </div>

                    {!neuroComplete && !neuroFeedback && (
                      <div className="w-full max-w-[300px] mt-8 flex flex-col gap-2">
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Frequência Decodificada</span>
                           <span className="text-[10px] font-mono text-violet-400">{neuroIndex + 1}/{REALITY_CHECK_DATA.length}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${((neuroIndex + 1) / REALITY_CHECK_DATA.length) * 100}%` }} 
                             className="h-full bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                           />
                        </div>
                      </div>
                    )}
                 </div>
               )}

               {selectedModule.dnsProvider && (
                 <div className="mt-6 mb-10">
                   <div className="flex bg-black/40 p-1 rounded-lg mb-4">
                     {['ANDROID', 'iOS'].map((os) => (
                       <button key={os} onClick={() => setSelectedDNS(os as 'ANDROID' | 'iOS')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedDNS === os ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>{os}</button>
                     ))}
                   </div>
                   <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6 relative group">
                     <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-bold">{selectedDNS === 'ANDROID' ? 'Hostname DNS' : 'Servidores DNS'}</p>
                     <code className="text-sm text-violet-400 font-mono block break-all font-bold">{selectedDNS === 'ANDROID' ? selectedModule.dnsProvider : '1.1.1.3 , 1.0.0.3'}</code>
                     <button onClick={() => { const val = selectedDNS === 'ANDROID' ? selectedModule.dnsProvider! : '1.1.1.3, 1.0.0.3'; navigator.clipboard.writeText(val); setShowCopyFeedback(true); setTimeout(() => setShowCopyFeedback(false), 2000); if (navigator.vibrate) navigator.vibrate(50); }} className="absolute right-2 top-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Copy size={16} /></button>
                     {showCopyFeedback && <span className="absolute right-12 top-4 text-[10px] font-bold text-green-500 uppercase tracking-widest animate-pulse">Copiado!</span>}
                   </div>
                   <div className="space-y-4">
                     {(selectedDNS === 'ANDROID' ? selectedModule.androidSteps : selectedModule.iosSteps)?.map((step, index) => (
                       <div key={index} className="flex items-start gap-4"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-black mt-0.5">{index + 1}</span><span className="text-xs text-gray-300 leading-relaxed font-medium">{step}</span></div>
                     ))}
                   </div>
                 </div>
               )}

               {selectedModule.videoUrl ? (
                  <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-10">
                    <iframe className="w-full h-full" src={selectedModule.videoUrl} title="Video Player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen></iframe>
                  </div>
               ) : null}

               {selectedModule.content && (
                  <div className="space-y-6 mb-10">
                    {selectedModule.content.map((item, idx) => (
                      <div key={idx}>
                        {item.type === 'text' && (<p className={`text-gray-300 text-sm leading-relaxed ${item.value.toString().startsWith('###') ? 'text-lg font-black text-white mt-4 mb-2 italic' : ''}`}>{item.value.toString().replace('### ', '')}</p>)}
                        {item.type === 'list' && Array.isArray(item.value) && (
                          <ul className="space-y-3 mt-3">
                            {item.value.map((li, lIdx) => (
                              <li key={lIdx} className="flex gap-4 items-start"><span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0 mt-0.5">{lIdx+1}</span><span className="text-xs text-gray-400 leading-relaxed">{li}</span></li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
               )}
             </div>
             
             {selectedModule.id !== 'tool_neurodebug' && (
               <div className="pt-6">
                  <button onClick={() => setSelectedModule(null)} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-colors">Fechar Protocolo</button>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};
