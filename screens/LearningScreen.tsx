import React, { useState, useEffect } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS, UserProfile } from '../types';
import { LEARNING_MODULES, LearningModule } from '../data/learningModules';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Activity } from 'lucide-react';

export const LearningScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [showFutureMilestones, setShowFutureMilestones] = useState(false);
  const [selectedDNS, setSelectedDNS] = useState<'ANDROID' | 'iOS'>('ANDROID');
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [activeNeuroTab, setActiveNeuroTab] = useState(0);

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

  // Lógica de Filtragem Dinâmica
  const currentStreak = profile?.currentStreak || 0;

  const baseModules = LEARNING_MODULES.filter((m) => {
    // Regra 1: Conteúdo Base (sem streak) sempre aparece
    if (!m.requiredStreak) return true;
    // Regra 2: Recompensa de 3 Dias sempre aparece (como teaser ou conquista)
    if (m.requiredStreak === 3) return true;
    // Regra 3: Outras recompensas sobem para o topo APENAS se desbloqueadas
    return m.requiredStreak <= currentStreak;
  }).sort((a, b) => {
    // Lógica de Ordenação: Recompensas no topo, Conteúdo depois
    const aIsReward = !!a.requiredStreak;
    const bIsReward = !!b.requiredStreak;

    // Se ambos são recompensas, ordene pelo dia (Crescente: 3, 7, 15...)
    if (aIsReward && bIsReward) {
      return (a.requiredStreak || 0) - (b.requiredStreak || 0);
    }
    // Se apenas A é recompensa, A vem primeiro
    if (aIsReward) return -1;
    // Se apenas B é recompensa, B vem primeiro
    if (bIsReward) return 1;
    // Se nenhum é recompensa, mantenha a ordem original
    return 0;
  });

  const futureModules = LEARNING_MODULES.filter((m) => {
    // Mostra na lista futura (embaixo) apenas se tiver streak, for maior que 3 dias E ainda estiver bloqueado
    return (
      m.requiredStreak && 
      m.requiredStreak > 3 && 
      currentStreak < m.requiredStreak
    );
  });

  const getIcon = (icon: any, color: string) => {
    if (typeof icon !== 'string') {
      const IconComp = icon;
      return <IconComp className="w-6 h-6" color={color} strokeWidth={2} />;
    }

    switch (icon) {
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
    setActiveNeuroTab(0);
    setSelectedModule(module);
  };

  const renderModuleCard = (module: LearningModule) => {
    const currentStreak = profile?.currentStreak || 0;
    const isLocked = !!module.requiredStreak && currentStreak < module.requiredStreak;
    const isUnlockedReward = !!module.requiredStreak && currentStreak >= module.requiredStreak;
    const isSpecial = module.isSpecialReward;

    // Encontra o módulo de referência (3D) para copiar o ícone dele para as demais recompensas
    const reward3DModule = LEARNING_MODULES.find(m => m.id === 'reward_3d');
    const RewardIcon = reward3DModule ? reward3DModule.icon : module.icon;
    const DisplayIcon = isUnlockedReward ? RewardIcon : module.icon;
    
    // Especialista UI: Padronização do estilo "Gold" para recompensas desbloqueadas
    const cardColors = isUnlockedReward ? {
        start: '#B45309', // Dourado Escuro (Fundo)
        end: '#FBBF24',   // Dourado Brilhante (Fundo)
        text: '#FFFFFF',  // BRANCO (Título)
        accent: '#FDE047' // AMARELO NEON (Ícone)
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
        className={`
          flex flex-col w-full p-4 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer
          ${isLocked ? 'border-gray-800/50 grayscale' : 'border-[#1F2937] hover:border-white/20'}
          ${isSpecial && !isLocked ? 'shadow-[0_0_30px_rgba(234,179,8,0.15)]' : ''}
        `}
        style={{
          background: isLocked 
            ? `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)`
            : `linear-gradient(135deg, ${cardColors.start} 0%, ${cardColors.end} 100%)`,
        }}
      >
        <div className={`flex items-center w-full transition-all duration-500 ${isLocked ? 'blur-md opacity-40 select-none pointer-events-none' : ''}`}>
          <div 
            className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-black/40 border mr-4 shadow-lg backdrop-blur-sm ${
              isSpecial ? 'border-yellow-500/30' : 'border-white/5'
            }`}
          >
            {getIcon(isLocked ? 'lock' : DisplayIcon, isLocked ? '#4B5563' : cardColors.accent)}
          </div>

          <div className="flex-1 text-left z-10 min-w-0">
            <span 
              className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 block opacity-80"
              style={{ color: cardColors.accent }}
            >
              {module.category}
            </span>
            <h3 
              className="text-base font-black leading-none mb-1.5 truncate italic"
              style={{ color: cardColors.text }}
            >
              {module.title}
            </h3>
            <p className={`text-xs truncate tracking-tight ${isUnlockedReward ? 'text-black font-semibold' : 'text-gray-400 font-bold'}`}>
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
              style={{ color: cardColors.accent }}
             >
               Desbloqueado no {module.requiredStreak}º dia de ofensiva
             </span>
          </div>
        )}

        {isSpecial && !isLocked && (
          <div 
            className="absolute -right-2 -top-2 w-16 h-16 rounded-full blur-2xl opacity-30 animate-pulse pointer-events-none"
            style={{ backgroundColor: cardColors.accent }}
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
            {/* Renderiza Módulos do Topo (Recompensas desbloqueadas + Conteúdo Base) */}
            {baseModules.map(renderModuleCard)}

            {/* Divisor / Botão de Expansão para Futuros Marcos */}
            {futureModules.length > 0 && (
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
                    {!showFutureMilestones && futureModules.slice(0, 3).map((m, i) => (
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
                      {futureModules.map(renderModuleCard)}
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
               
               {/* RENDERIZAÇÃO DO NEURODEBUG (ATUALIZADA: CORES DNS & SEM RODAPÉ) */}
               {selectedModule.id === 'tool_neurodebug' && selectedModule.neuroTabs && (
                 <div className="mt-6 mb-10">
                   {/* Menu de Abas */}
                   <div className="flex flex-wrap gap-2 mb-6 bg-black/40 p-1 rounded-xl">
                     {selectedModule.neuroTabs.map((tab, index) => (
                       <button
                         key={index}
                         onClick={() => setActiveNeuroTab(index)}
                         className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                           activeNeuroTab === index
                             ? 'bg-white/10 text-white shadow-lg border border-white/10' // Ativo: Neutro/Brilho
                             : 'text-gray-500 hover:text-gray-300 hover:bg-white/5' // Inativo
                         }`}
                       >
                         {tab.title}
                       </button>
                     ))}
                   </div>

                   {/* Conteúdo da Aba Ativa */}
                   <div className="bg-black/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                     
                     {/* Efeito de Fundo (Agora Roxo/DNS em vez de Azul) */}
                     <div 
                       className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 pointer-events-none" 
                       style={{ backgroundColor: selectedModule.colors?.accent || '#A78BFA' }}
                     />
                     
                     <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3 italic">
                       {/* Ícone usando a cor de accent do módulo */}
                       <Activity size={20} style={{ color: selectedModule.colors?.accent || '#A78BFA' }} />
                       {selectedModule.neuroTabs[activeNeuroTab].title}
                     </h4>
                     
                     <p className="text-gray-300 leading-relaxed text-sm font-medium">
                       {selectedModule.neuroTabs[activeNeuroTab].description}
                     </p>

                     {/* RODAPÉ DECORATIVO REMOVIDO CONFORME SOLICITADO */}
                   </div>
                 </div>
               )}

               {/* RESTAURAÇÃO DO COMPONENTE DE ABAS DE DNS */}
               {selectedModule.dnsProvider && (
                 <div className="mt-6 mb-10">
                   {/* Seletor de Sistema Operacional */}
                   <div className="flex bg-black/40 p-1 rounded-lg mb-4">
                     {['ANDROID', 'iOS'].map((os) => (
                       <button
                         key={os}
                         onClick={() => setSelectedDNS(os as 'ANDROID' | 'iOS')}
                         className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                           selectedDNS === os 
                             ? 'bg-white/10 text-white shadow-sm' 
                             : 'text-gray-500 hover:text-gray-300'
                         }`}
                       >
                         {os}
                       </button>
                     ))}
                   </div>

                   {/* Área de Cópia do Endereço */}
                   <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6 relative group">
                     <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-bold">
                       {selectedDNS === 'ANDROID' ? 'Hostname DNS' : 'Servidores DNS'}
                     </p>
                     <code className="text-sm text-violet-400 font-mono block break-all font-bold">
                       {selectedDNS === 'ANDROID' ? selectedModule.dnsProvider : '1.1.1.3 , 1.0.0.3'}
                     </code>
                     <button
                       onClick={() => {
                         const val = selectedDNS === 'ANDROID' ? selectedModule.dnsProvider! : '1.1.1.3, 1.0.0.3';
                         navigator.clipboard.writeText(val);
                         setShowCopyFeedback(true);
                         setTimeout(() => setShowCopyFeedback(false), 2000);
                         if (navigator.vibrate) navigator.vibrate(50);
                       }}
                       className="absolute right-2 top-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                     >
                       <Copy size={16} />
                     </button>
                     {showCopyFeedback && (
                       <span className="absolute right-12 top-4 text-[10px] font-bold text-green-500 uppercase tracking-widest animate-pulse">Copiado!</span>
                     )}
                   </div>

                   {/* Lista de Passos */}
                   <div className="space-y-4">
                     {(selectedDNS === 'ANDROID' ? selectedModule.androidSteps : selectedModule.iosSteps)?.map((step, index) => (
                       <div key={index} className="flex items-start gap-4">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-black mt-0.5">
                           {index + 1}
                         </span>
                         <span className="text-xs text-gray-300 leading-relaxed font-medium">{step}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

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

               {/* Renderização de Content Genérico */}
               {selectedModule.content && (
                  <div className="space-y-6 mb-10">
                    {selectedModule.content.map((item, idx) => (
                      <div key={idx}>
                        {item.type === 'text' && (
                          <p className={`text-gray-300 text-sm leading-relaxed ${item.value.toString().startsWith('###') ? 'text-lg font-black text-white mt-4 mb-2 italic' : ''}`}>
                            {item.value.toString().replace('### ', '')}
                          </p>
                        )}
                        {item.type === 'list' && Array.isArray(item.value) && (
                          <ul className="space-y-3 mt-3">
                            {item.value.map((li, lIdx) => (
                              <li key={lIdx} className="flex gap-4 items-start">
                                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0 mt-0.5">{lIdx+1}</span>
                                <span className="text-xs text-gray-400 leading-relaxed">{li}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
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