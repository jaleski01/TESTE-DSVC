
import { doc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export const getTodayString = () => {
  return new Date().toLocaleDateString('en-CA');
};

/**
 * Retorna a string da data de ontem no formato YYYY-MM-DD
 */
export const getYesterdayString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString('en-CA');
};

export const getDaysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const ACHIEVEMENTS = [
  { id: 'streak_3d', days: 3, title: 'Resiliência Inicial', message: 'Seu cérebro está começando a limpar os receptores de dopamina.' },
  { id: 'streak_7d', days: 7, title: 'Neuroplasticidade Ativa', message: 'Novos caminhos neurais estão sendo formados agora!' },
  { id: 'streak_15d', days: 15, title: 'Mestre do Hábito', message: 'Você provou que é mais forte que o impulso químico.' },
  { id: 'streak_30d', days: 30, title: 'Fortaleza Mental', message: 'A sua biologia mudou. Você é uma nova pessoa.' }
];

export type StreakStatus = 'OK' | 'NEEDS_RECOVERY' | 'RESET';

export interface VerifyStreakResult {
  status: StreakStatus;
  profile: UserProfile;
}

/**
 * Reality Check Logic
 */
export const saveRealityCheckResult = async (uid: string, factId: number, isCorrect: boolean) => {
  const userRef = doc(db, "users", uid);
  const today = getTodayString();
  
  const update: any = {
    daily_fact_count: increment(1),
    last_fact_date: today,
    seen_fact_ids: arrayUnion(factId),
    last_updated: serverTimestamp()
  };

  if (isCorrect) {
    update.reality_check_points = increment(1);
  }

  await updateDoc(userRef, update);
};

/**
 * Verifica se a ofensiva precisa ser resetada ou recuperada.
 */
export const verifyAndResetStreak = async (uid: string, profile: UserProfile): Promise<UserProfile & { streakStatus?: StreakStatus }> => {
  const today = getTodayString();
  const lastDate = profile.lastCheckInDate;

  // Reset daily facts if day changed
  if (profile.last_fact_date && profile.last_fact_date !== today) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { daily_fact_count: 0 });
    profile.daily_fact_count = 0;
  }

  if (!lastDate) return profile;
  if (lastDate === today) return { ...profile, streakStatus: 'OK' };
  
  const diff = getDaysDiff(lastDate, today);

  if (diff === 2) {
    return { ...profile, streakStatus: 'NEEDS_RECOVERY' };
  } else if (diff > 2) {
    const userRef = doc(db, "users", uid);
    const update = { currentStreak: 0, lastCheckInDate: today };
    await updateDoc(userRef, update);
    return { ...profile, ...update, streakStatus: 'RESET' };
  }

  return { ...profile, streakStatus: 'OK' };
};

/**
 * BUG FIX: Ao restaurar a ofensiva, definimos a última data como ONTEM.
 * Isso garante que a ofensiva não seja resetada, mas mantém os rituais de HOJE pendentes.
 */
export const restoreStreak = async (uid: string, profile: UserProfile) => {
  const userRef = doc(db, "users", uid);
  const yesterday = getYesterdayString();
  
  const update = {
    lastCheckInDate: yesterday, // Define como concluído o dia anterior que foi pulado
    last_updated: serverTimestamp()
  };

  await updateDoc(userRef, update);
  return { ...profile, ...update };
};

export const forceResetStreak = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const today = getTodayString();
  const update = {
    currentStreak: 0,
    lastCheckInDate: today,
    last_updated: serverTimestamp()
  };
  await updateDoc(userRef, update);
  return update;
};

export const claimStreakReward = async (uid: string, rewardId: string) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    claimed_rewards: arrayUnion(rewardId),
    last_updated: serverTimestamp()
  });
};

export const performDailyCheckIn = async (uid: string, profile: UserProfile) => {
  const today = getTodayString();
  if (profile.lastCheckInDate === today) return { success: false, alreadyDone: true };

  const userRef = doc(db, "users", uid);
  const newStreak = (profile.currentStreak || 0) + 1;
  const newLongest = Math.max(newStreak, profile.longestStreak || 0);
  
  const update: any = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastCheckInDate: today,
    last_updated: serverTimestamp()
  };

  const newAchievements: string[] = [];
  ACHIEVEMENTS.forEach(ach => {
    if (newStreak >= ach.days && !profile.unlockedAchievements?.includes(ach.id)) {
      newAchievements.push(ach.id);
    }
  });

  if (newAchievements.length > 0) {
    update.unlockedAchievements = arrayUnion(...newAchievements);
  }

  await updateDoc(userRef, update);

  return {
    success: true,
    newStreak,
    newAchievements: ACHIEVEMENTS.filter(a => newAchievements.includes(a.id))
  };
};
