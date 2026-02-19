import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { COLORS, DAILY_MISSIONS, UserProfile, DailyMission } from '../types';
import { updateAllProgressCaches } from '../services/progressService';
import { Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyHabitsProps {
  profile: UserProfile | null;
  refreshTrigger?: number; // Prop used to force local storage re-read
}

export const DailyHabits: React.FC<DailyHabitsProps> = ({ profile, refreshTrigger }) => {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  
  const todayDate = new Date().toLocaleDateString('en-CA');
  const SELECAO_KEY = `@daily_missions_selecao_${todayDate}`;
  const COMPLETED_KEY = `@daily_missions_progresso_${todayDate}`;

  // Fallback para quando o Firestore não retorna dados (offline ou primeiro acesso sem sync)
  const loadDataFromStorage = () => {
    try {
      const savedMissions = localStorage.getItem(SELECAO_KEY);
      if (savedMissions) {
        setMissions(JSON.parse(savedMissions));
      }

      const savedProgress = localStorage.getItem(COMPLETED_KEY);
      if (savedProgress) {
        setCompletedIds(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error("Failed to load missions from storage", error);
    }
  };

  useEffect(() => {
    const fetchCloudProgress = async () => {
      const user = auth.currentUser;
      if (!user) {
        loadDataFromStorage();
        return;
      }

      try {
        const historyRef = doc(db, "users", user.uid, "daily_history", todayDate);
        const snap = await getDoc(historyRef);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // Sincroniza Missões Selecionadas
          if (data.selected_missions) {
            setMissions(data.selected_missions);
            localStorage.setItem(SELECAO_KEY, JSON.stringify(data.selected_missions));
          } else {
            // Se o doc existe mas não tem missões (ex: log de gatilho), tenta local
            const savedMissions = localStorage.getItem(SELECAO_KEY);
            if (savedMissions) setMissions(JSON.parse(savedMissions));
          }

          // Sincroniza Progresso (IDs completados)
          if (data.habits_ids) {
            setCompletedIds(data.habits_ids);
            localStorage.setItem(COMPLETED_KEY, JSON.stringify(data.habits_ids));
          } else {
            const savedProgress = localStorage.getItem(COMPLETED_KEY);
            if (savedProgress) setCompletedIds(JSON.parse(savedProgress));
          }
        } else {
          // Documento não existe na nuvem hoje, usa dados locais
          loadDataFromStorage();
        }
      } catch (e) {
        console.warn("[CloudSync] Falha ao buscar progresso na nuvem, usando fallback local", e);
        loadDataFromStorage();
      }
    };

    fetchCloudProgress();
  }, [todayDate, refreshTrigger]);

  const syncProgressToDB = async (currentIds: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const total = 3; 
      const count = currentIds.length;
      const percentage = Math.round((count / total) * 100);

      const historyRef = doc(db, "users", user.uid, "daily_history", todayDate);

      // Usa merge: true para não apagar a seleção de missões ou outros dados do dia
      await setDoc(historyRef, {
        date: todayDate,
        completed_count: count,
        total_habits: total,
        habits_ids: currentIds,
        percentage: percentage,
        last_updated: new Date().toISOString()
      }, { merge: true });
    } catch (error) { 
      console.error("[DailyHabits] Sync failed", error); 
    }
  };

  const toggleHabit = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    setCompletedIds(prev => {
      const isCompleted = prev.includes(id);
      let newHabits = isCompleted ? prev.filter(item => item !== id) : [...prev, id];
      
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(newHabits));
      updateAllProgressCaches().catch(console.error);
      syncProgressToDB(newHabits);
      
      return newHabits;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {missions.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full py-8 px-4 rounded-2xl border border-dashed border-[#2E243D] flex flex-col items-center justify-center text-center bg-violet-500/5"
          >
            <Zap className="text-violet-500/40 mb-3" size={32} />
            <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Arsenal Vazio</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Aceite 3 missões nos cards acima para definir seus objetivos de hoje.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col w-full"
          >
            {missions.map((mission) => {
              const isChecked = completedIds.includes(mission.id);
              return (
                <motion.button
                  key={mission.id}
                  variants={itemVariants}
                  onClick={() => toggleHabit(mission.id)}
                  className={`flex flex-row items-center w-full mb-3 px-4 rounded-xl border transition-all duration-300 active:scale-[0.98] group
                    ${isChecked 
                      ? 'bg-[#10B981]/5 border-[#10B981]/30' 
                      : 'bg-[#0F0A15]/60 backdrop-blur-md border-[#2E243D]'}`}
                  style={{ minHeight: '64px' }}
                >
                  <div className={`flex-1 text-left mr-4 py-3`}>
                    <span className={`text-sm font-bold block mb-0.5 transition-colors ${isChecked ? 'text-emerald-400' : 'text-white'}`}>
                      {mission.label}
                    </span>
                    <span className="text-[10px] text-gray-500 leading-tight block">
                      {mission.desc}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all
                       ${isChecked 
                         ? 'bg-[#10B981] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                         : 'border-[#2E243D] bg-transparent'}`}>
                       {isChecked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={4} />}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};