
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { COLORS, UserProfile, Routes } from '../types';
import { claimStreakReward } from '../services/gamificationService';
import { 
  fetchAndCacheProgressData, 
  updateAllProgressCaches,
  ProgressDataPackage, 
  ChartDataPoint, 
  Stats, 
  TriggerInsight 
} from '../services/progressService';
import { motion, AnimatePresence } from 'framer-motion';

const RANGES = [7, 15, 30, 90];
const MILESTONES = [3, 7, 15, 30, 90];
const ITEM_HEIGHT = {
  mobile: 130,
  desktop: 130
}; 
const TOTAL_DAYS = 90;

type TabType = 'JOURNEY' | 'ANALYSIS';

interface PathPoint {
  x: number;
  y: number;
  day: number;
  isMilestone: boolean;
}

export const ProgressScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('JOURNEY');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // New State for Universal Milestone Unlock
  const [selectedUnlockDay, setSelectedUnlockDay] = useState<number | null>(null);

  // Analysis State
  const [selectedRange, setSelectedRange] = useState(7);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<Stats>({ average: 0, perfectDays: 0 });
  const [triggerInsight, setTriggerInsight] = useState<TriggerInsight | null>(null);
  
  // Refs
  const journeyContainerRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const currentDayNodeRef = useRef<HTMLDivElement>(null);

  // --- WIDE ZIG-ZAG PATH LOGIC ---
  const journeyPoints = useMemo<PathPoint[]>(() => {
    const xPattern = [15, 40, 75, 85, 75, 40]; 
    
    return Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const day = i + 1;
      const x = xPattern[i % xPattern.length];
      const y = i * ITEM_HEIGHT.mobile + 100; 
      return { x, y, day, isMilestone: MILESTONES.includes(day) };
    });
  }, []);

  const generatePathData = (points: PathPoint[]) => {
    if (points.length === 0) return "";
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  };

  const fullPathData = useMemo(() => generatePathData(journeyPoints), [journeyPoints]);

  const progressPathData = useMemo(() => {
    if (!profile) return "";
    const streak = profile.currentStreak || 0;
    
    // CORREÇÃO: Alinhamento estrito com a Dashboard.
    const activeDay = streak === 0 ? 1 : streak;
    
    const progressPoints = journeyPoints.slice(0, activeDay);
    return generatePathData(progressPoints);
  }, [profile, journeyPoints]);

  // --- INITIALIZATION & BACKGROUND SYNC ---
  const loadProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        localStorage.setItem('user_profile', JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadProfile(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClaimReward = async (day: number) => {
    if (!profile || !auth.currentUser || isClaiming) return;
    
    // Processamento específico para o Dia 3 (único que tem lógica de 'claim' explícito no banco por enquanto)
    if (day === 3 && (profile.currentStreak || 0) >= 3) {
      const rewardId = 'reward_coolidge_day3';
      if (profile.claimed_rewards?.includes(rewardId)) return;

      setIsClaiming(true);
      try {
        await claimStreakReward(auth.currentUser.uid, rewardId);
        await loadProfile(auth.currentUser.uid);
        setShowRewardAlert(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => setShowRewardAlert(false), 5000);
      } catch (e) {
        console.error("Error claiming reward", e);
      } finally {
        setIsClaiming(false);
      }
    }
  };

  const handleAccessContent = () => {
    if (selectedUnlockDay === 3) {
      handleClaimReward(3);
    }
    navigate(Routes.LEARNING);
    setSelectedUnlockDay(null);
  };

  const refreshAnalysisData = async (rangeToRefresh: number) => {
    const cacheKey = `@progress_data_${rangeToRefresh}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { data } = JSON.parse(cached) as { data: ProgressDataPackage };
        setChartData(data.chartData);
        setStats(data.stats);
        setTriggerInsight(data.triggerInsight);
      } catch (e) {
        console.warn("Invalid progress cache");
      }
    } else {
      setLoadingAnalysis(true);
    }

    try {
      await updateAllProgressCaches();
      const freshData = await fetchAndCacheProgressData(rangeToRefresh);
      if (freshData) {
        setChartData(freshData.chartData);
        setStats(freshData.stats);
        setTriggerInsight(freshData.triggerInsight);
      }
    } catch (error) {
      console.error("Background analysis sync failed:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    refreshAnalysisData(selectedRange);
  }, [selectedRange]);

  // ANIMATED INITIAL SCROLL
  useEffect(() => {
    if (activeTab === 'JOURNEY' && currentDayNodeRef.current && journeyContainerRef.current && !isLoadingProfile) {
      const container = journeyContainerRef.current;
      const targetElement = currentDayNodeRef.current;
      
      const targetPosition = targetElement.offsetTop - (container.clientHeight / 2) + (targetElement.clientHeight / 2);
      const startPosition = container.scrollTop;
      const distance = targetPosition - startPosition;
      const duration = 2000;
      let startTime: number | null = null;

      const easeInOutQuad = (t: number) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutQuad(progress);

        container.scrollTop = startPosition + (distance * ease);

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      const timer = setTimeout(() => {
        requestAnimationFrame(animation);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoadingProfile, journeyPoints]);

  useEffect(() => {
    if (activeTab === 'ANALYSIS' && chartData.length > 0 && chartScrollRef.current) {
      setTimeout(() => {
        if (chartScrollRef.current) {
          chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [activeTab, chartData]);

  const getBarWidthClass = () => (selectedRange === 7 ? "w-8" : "w-4");

  const getUnlockData = (day: number) => {
    switch(day) {
      case 3: return { title: "Protocolo de Dopamina", subtitle: "O Efeito Coolidge", description: "Entenda a ciência da novidade e como seu cérebro busca estímulos." };
      case 7: return { title: "Neuroplasticidade Acelerada", subtitle: "Módulo de 7 Dias", description: "Técnicas avançadas de estoicismo aplicadas à resistência mental." };
      case 15: return { title: "Controle de Impulso", subtitle: "Arquivos do Tenente", description: "Um mergulho técnico na capacidade do cérebro de se regenerar." };
      case 30: return { title: "Identidade Blindada", subtitle: "Dossiê Major", description: "Sublimação da energia sexual em poder e foco profissional." };
      case 90: return { title: "O Novo Eu", subtitle: "Legado do Veterano", description: "A graduação final. O vício se torna memória e o propósito guia." };
      default: return { title: "Marco Alcançado", subtitle: `Dia ${day}`, description: "Continue firme na jornada." };
    }
  };

  return (
    <Wrapper noPadding>
      <div className="flex-1 w-full h-full flex flex-col bg-transparent overflow-hidden">
        
        {/* REWARD TOAST ALERT */}
        <AnimatePresence>
          {showRewardAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 left-6 right-6 z-[100] p-4 bg-yellow-500 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center gap-4"
            >
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl">🏆</span>
               </div>
               <div className="flex-1">
                  <h4 className="text-sm font-black text-black uppercase tracking-tight">Recompensa Desbloqueada!</h4>
                  <p className="text-[10px] font-bold text-black/70">Aula disponível na aba Base.</p>
               </div>
               <button onClick={() => setShowRewardAlert(false)} className="text-black/40 hover:text-black">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FIXED HEADER & TAB SELECTOR */}
        <div className="px-5 pt-6 pb-4 shrink-0 z-50 bg-transparent">
          <div className="flex flex-col mb-4">
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic">
              Evolução Tática
            </h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase">
              {activeTab === 'JOURNEY' ? 'Caminho da Maestria' : 'Análise de Performance'}
            </p>
          </div>

          <div className="flex p-1 bg-[#0F0A15] border border-[#2E243D] rounded-xl">
            <button 
              onClick={() => setActiveTab('JOURNEY')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all duration-300 tracking-widest uppercase ${activeTab === 'JOURNEY' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'text-gray-500'}`}
            >
              Ofensiva
            </button>
            <button 
              onClick={() => setActiveTab('ANALYSIS')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all duration-300 tracking-widest uppercase ${activeTab === 'ANALYSIS' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'text-gray-500'}`}
            >
              Análise
            </button>
          </div>
        </div>

        {/* PERSISTENT CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* --- TAB: OFENSIVA (JOURNEY) --- */}
          <div 
            ref={journeyContainerRef}
            className={`absolute inset-0 overflow-y-auto scrollbar-hide w-full transition-opacity duration-300 ${
              activeTab === 'JOURNEY' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div 
              className="w-full relative px-8" 
              style={{ height: `${TOTAL_DAYS * ITEM_HEIGHT.mobile + 250}px` }}
            >
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                preserveAspectRatio="none"
                viewBox={`0 0 100 ${TOTAL_DAYS * ITEM_HEIGHT.mobile + 250}`}
              >
                <path 
                  d={fullPathData} 
                  fill="none" 
                  stroke="#374151" 
                  strokeWidth="0.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                <path 
                  d={progressPathData} 
                  fill="none" 
                  stroke={COLORS.Primary} 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }}
                />
              </svg>

              {journeyPoints.map((pt) => {
                const currentStreak = profile?.currentStreak || 0;
                const activeDay = currentStreak === 0 ? 1 : currentStreak;
                const isCurrent = pt.day === activeDay;
                const isCompleted = pt.day < activeDay; 
                const isLocked = pt.day > activeDay;
                
                // Special Days handling (3, 7, 15, 30, 90)
                const isSpecialDay = MILESTONES.includes(pt.day);
                
                // Logic: A milestone is unlocked if user reached it or passed it
                const isUnlockedMilestone = isSpecialDay && currentStreak >= pt.day;

                const labelSide = pt.x < 50 ? 'right' : 'left';

                const renderIcon = () => {
                  if (isSpecialDay) {
                    const iconColor = isUnlockedMilestone ? 'text-black' : (isLocked ? 'text-gray-600' : 'text-white');
                    
                    const renderIconForDay = () => {
                      if (pt.day === 3) return <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />; // Bolt
                      if (pt.day === 7) return <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />; // Chevron
                      if (pt.day === 15) return <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />; // Shield
                      if (pt.day === 30) return <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />; // Sun
                      if (pt.day === 90) return <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-.363 1.118l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />; // Star
                      return null;
                    };

                    return (
                      <svg className={`w-8 h-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {renderIconForDay()}
                      </svg>
                    );
                  }

                  // REGULAR DAYS
                  return (
                    <span className={`text-2xl font-black ${isCompleted ? 'text-white' : (isLocked ? 'text-gray-600' : 'text-white')}`}>
                      {pt.day}
                    </span>
                  );
                };

                return (
                  <div 
                    key={pt.day}
                    ref={isCurrent ? currentDayNodeRef : null}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${pt.x}%`, top: `${pt.y}px` }}
                  >
                    <button 
                      onClick={() => {
                        if (isSpecialDay && isUnlockedMilestone) {
                           setSelectedUnlockDay(pt.day);
                        }
                      }}
                      disabled={isSpecialDay && !isUnlockedMilestone}
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2
                        ${isUnlockedMilestone 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-yellow-300/50 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105 cursor-pointer hover:scale-110' 
                          : isCurrent 
                            ? 'bg-[#0F0A15] border-violet-500 animate-pulse scale-110 shadow-[0_0_25px_rgba(139,92,246,0.8)]' 
                            : isCompleted 
                              ? 'bg-violet-600 border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
                              : 'bg-[#111111] border-gray-800 opacity-60' 
                        }
                      `}
                    >
                      {renderIcon()}
                    </button>

                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-6
                        ${labelSide === 'right' ? 'left-full text-left' : 'right-full text-right'}
                        ${isCurrent || isUnlockedMilestone ? 'opacity-100' : 'opacity-30'}
                      `}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-tighter block leading-none ${isUnlockedMilestone ? 'text-yellow-500' : (isCurrent ? 'text-violet-400' : 'text-gray-500')}`}>
                        DIA {pt.day}
                      </span>
                      {pt.isMilestone && (
                        <div className={`mt-1 flex items-center gap-1 ${labelSide === 'right' ? 'flex-row' : 'flex-row-reverse'} ${isLocked ? 'opacity-40 grayscale' : ''}`}>
                           <div className={`w-1 h-1 rounded-full ${
                             isUnlockedMilestone 
                               ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,1)] animate-pulse' 
                               : 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]'
                           }`}></div>
                           <span className={`text-[8px] font-black tracking-widest uppercase ${
                             isUnlockedMilestone 
                               ? 'text-yellow-400 animate-pulse' 
                               : 'text-yellow-500'
                           }`}>
                             {isUnlockedMilestone ? 'ACESSAR' : 'RECOMPENSA'}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- TAB: ANÁLISE (ANALYSIS) --- */}
          <div 
            className={`absolute inset-0 overflow-y-auto scrollbar-hide w-full px-5 pt-3 pb-32 flex flex-col transition-opacity duration-300 ${
              activeTab === 'ANALYSIS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="w-full max-w-full flex flex-col">
              <div className="w-full flex p-1 rounded-xl mb-6 bg-[#1F2937]/30 border border-[#2E243D]">
                {RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      selectedRange === range 
                        ? 'bg-[#8B5CF6] text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {range}D
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 w-full">
                <div className="p-4 rounded-xl border border-[#2E243D] bg-[#0F0A15]/80 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden w-full">
                  <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 z-10">Média</span>
                  <span className="text-3xl font-bold text-white z-10">
                    {stats.average}%
                  </span>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#8B5CF6]/10 rounded-full blur-xl"></div>
                </div>
                
                <div className="p-4 rounded-xl border border-[#2E243D] bg-[#0F0A15]/80 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden w-full">
                  <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 z-10">Dias Perfeitos</span>
                  <span className="text-3xl font-bold text-white z-10">
                    {stats.perfectDays}
                  </span>
                   <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl"></div>
                </div>
              </div>

              <div className="w-full flex flex-col mb-10">
                <h3 className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.3em]">
                  Gráfico de Disciplina
                </h3>

                {loadingAnalysis && chartData.length === 0 ? (
                   <div className="w-full h-[200px] flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                   </div>
                ) : chartData.length === 0 ? (
                  <div className="w-full h-[200px] flex flex-col items-center justify-center text-center opacity-50 border border-dashed border-gray-800 rounded-xl">
                     <p className="text-sm font-bold text-white mb-2">Jornada Iniciada</p>
                     <p className="text-xs text-gray-400">Gere dados completando seus rituais.</p>
                  </div>
                ) : (
                  <div 
                    ref={chartScrollRef}
                    className={`w-full ${selectedRange === 7 || selectedRange === 15 ? 'overflow-x-hidden' : 'overflow-x-auto'} pb-4 scrollbar-hide`}
                  >
                    <div 
                      className={`flex items-end min-w-full ${selectedRange === 7 || selectedRange === 15 ? 'justify-between px-0' : 'gap-3 px-2'} border-b border-[#2E243D] relative transition-opacity duration-300`}
                      style={{ height: '200px' }} 
                    >
                      {chartData.map((item, index) => {
                        const hasData = item.value > 0;
                        const barHeight = `${item.value}%`; 
                        
                        return (
                          <div key={`${selectedRange}-${index}`} className="flex flex-col items-center gap-2 group cursor-pointer z-10 h-full justify-end flex-shrink-0">
                            <div className="relative flex items-end h-full w-full justify-center">
                              <div 
                                className={`rounded-t-sm transition-all duration-700 ease-out relative ${getBarWidthClass()}`}
                                style={{ 
                                  height: hasData ? barHeight : '4px',
                                  backgroundColor: hasData ? COLORS.Primary : '#1F2937',
                                  minHeight: '4px',
                                }}
                              >
                                {item.value === 100 && (
                                    <div className="absolute inset-0 bg-[#8B5CF6] blur-[6px] opacity-50"></div>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-500">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                    Raio-X de Gatilhos
                  </h3>
                </div>

                {triggerInsight && triggerInsight.totalLogs > 0 ? (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1F1212] to-[#000000] border border-red-900/30 relative overflow-hidden w-full">
                      <h4 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Ponto de Falha Crítico</h4>
                      <p className="text-sm font-medium text-white leading-relaxed z-10 relative">
                        Nos últimos {selectedRange} dias, <span className="text-red-400 font-bold">{triggerInsight.topEmotion?.percentage}%</span> dos seus gatilhos foram disparados por <span className="text-red-400 font-bold">{triggerInsight.topEmotion?.name}</span> em contextos de <span className="text-white border-b border-red-500/50">{triggerInsight.topContext?.name}</span>.
                      </p>
                    </div>

                    <div className="bg-[#0F0A15]/80 backdrop-blur-sm rounded-xl border border-[#2E243D] p-4 w-full">
                      <h5 className="text-[9px] uppercase text-gray-500 font-black mb-3 tracking-widest">Recorrência</h5>
                      <div className="flex flex-col gap-3 w-full">
                        {triggerInsight.ranking.map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-600">0{idx + 1}</span>
                              <span className="text-xs text-white font-bold">{item.name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono bg-[#1F2937] px-2 py-1 rounded">
                              {item.count}X
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-6 rounded-xl border border-dashed border-[#2E243D] flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-gray-500 font-bold">Sem logs de gatilhos neste período.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DESBLOQUEIO DE MARCO */}
      <AnimatePresence>
        {selectedUnlockDay !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0F0A15] border border-yellow-500/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col items-center text-center"
            >
              {/* Efeito Glow */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 bg-yellow-500/10 rounded-full border border-yellow-500/50 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(234,179,8,0.3)] animate-pulse relative z-10">
                <span className="text-3xl">🏆</span>
              </div>

              <h2 className="text-xl font-black text-white uppercase italic tracking-wide mb-1">
                {getUnlockData(selectedUnlockDay).title}
              </h2>
              <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-4">
                {getUnlockData(selectedUnlockDay).subtitle}
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {getUnlockData(selectedUnlockDay).description}
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handleAccessContent}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 transition-all"
                >
                  Acessar Conteúdo
                </button>
                <button 
                  onClick={() => setSelectedUnlockDay(null)}
                  className="w-full py-4 rounded-xl text-gray-500 font-bold hover:text-white transition-colors uppercase text-xs tracking-widest"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};
