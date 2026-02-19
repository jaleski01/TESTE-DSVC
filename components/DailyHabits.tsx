
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { COLORS, DAILY_MISSIONS, UserProfile, DailyMission } from '../types';
import { updateAllProgressCaches } from '../services/progressService';
import { Zap, Check } from 'lucide-react';

interface DailyHabitsProps {
  profile: UserProfile | null;
}

export const DailyHabits: React.FC<DailyHabitsProps> = ({ profile }) => {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  
  const todayDate = new Date().toLocaleDateString('en-CA');
  const SELECAO_KEY = `@daily_missions_selecao_${todayDate}`;
  const COMPLETED_KEY = `@daily_missions_progresso_${todayDate}`;

  useEffect(() => {
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
      console.error("Failed to load missions", error);
    }
  }, [SELECAO_KEY, COMPLETED_KEY]);

  const syncProgressToDB = async (currentIds: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const total = 3; // Meta fixa agora é 3
      const count = currentIds.length;
      const percentage = Math.round((count / total) * 100);

      const historyRef = doc(db, "users", user.uid, "daily_history", todayDate);

      await setDoc(historyRef, {
        date: todayDate,
        completed_count: count,
        total_habits: total,
        habits_ids: currentIds,
        percentage: percentage,
        last_updated: new Date().toISOString()
      }, { merge: true });
    } catch (error) { console.error(error); }
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

  if (missions.length === 0) {
    return (
      <div className="w-full py-8 px-4 rounded-2xl border border-dashed border-[#2E243D] flex flex-col items-center justify-center text-center bg-violet-500/5">
        <Zap className="text-violet-500/40 mb-3" size={32} />
        <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Arsenal Vazio</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          Aceite 3 missões nos cards acima para definir seus objetivos de hoje.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {missions.map((mission) => {
        const isChecked = completedIds.includes(mission.id);
        return (
          <button
            key={mission.id}
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
          </button>
        );
      })}
    </div>
  );
};
