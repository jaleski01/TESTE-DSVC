
import { doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

/**
 * Retorna a data atual no formato YYYY-MM-DD baseado no fuso local
 */
export const getTodayString = () => {
  return new Date().toLocaleDateString('en-CA');
};

/**
 * Calcula a diferença de dias entre duas strings YYYY-MM-DD
 */
export const getDaysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const ACHIEVEMENTS = [
  { id: 'streak_3d', days: 3, title: 'Resiliência Inicial', message: 'Seu cérebro está começando a limpar os receptores de dopamina.' },
  { id: 'streak_7d', days: 7, title: 'Neuroplasticidade Ativa', message: 'Novos caminhos neurais estão sendo formados agora!' },
  { id: 'streak_15d', days: 15, title: 'Mestre do Hábito', message: 'Você provou que é mais forte que o impulso químico.' },
  { id: 'streak_30d', days: 30, title: 'Fortaleza Mental', message: 'A sua biologia mudou. Você é uma nova pessoa.' }
];

/**
 * Verifica se a ofensiva precisa ser resetada (se passou mais de 1 dia desde o último check-in)
 */
export const verifyAndResetStreak = async (uid: string, profile: UserProfile): Promise<UserProfile> => {
  const today = getTodayString();
  const lastDate = profile.lastCheckInDate;

  if (!lastDate) return profile;
  
  const diff = getDaysDiff(lastDate, today);

  // Se passou mais de 1 dia (pulou ontem), reseta
  if (diff > 1) {
    const userRef = doc(db, "users", uid);
    const update = { currentStreak: 0 };
    await updateDoc(userRef, update);
    return { ...profile, ...update };
  }

  return profile;
};

/**
 * Realiza o Check-in diário
 */
export const performDailyCheckIn = async (uid: string, profile: UserProfile) => {
  const today = getTodayString();
  
  // Já fez check-in hoje?
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

  // Verifica novas conquistas
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

  // Retorna dados para animação e modal
  return {
    success: true,
    newStreak,
    newAchievements: ACHIEVEMENTS.filter(a => newAchievements.includes(a.id))
  };
};
