
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TriggerLog {
  id?: string;
  date_string: string;
  day_number: number;
  timestamp: any;
  time_slot: string;
  emotion: string;
  context: string;
  intensity: number;
  type: 'urgency' | 'relapse'; // Adicionado para qualificação do log
}

const getTimeSlot = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 0 && hour < 6) return 'Madrugada';
  if (hour >= 6 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 18) return 'Tarde';
  return 'Noite';
};

export const logTrigger = async (
  uid: string, 
  emotion: string, 
  context: string, 
  intensity: number,
  type: 'urgency' | 'relapse' = 'urgency'
) => {
  try {
    const now = new Date();
    const dateKey = now.toLocaleDateString('en-CA');
    const timeSlot = getTimeSlot(now);
    let dayNumber = 1;

    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const streakStart = userData.current_streak_start;

      if (streakStart) {
        let startDate: Date;
        if (typeof streakStart === 'string') {
          startDate = new Date(streakStart);
        } else if (streakStart?.toDate) {
          startDate = streakStart.toDate();
        } else {
          startDate = new Date();
        }

        if (!isNaN(startDate.getTime())) {
          const diff = now.getTime() - startDate.getTime();
          const calculatedDay = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
          dayNumber = calculatedDay > 0 ? calculatedDay : 1;
        }
      }
    }

    const payload = {
      uid,
      emotion,
      context,
      intensity,
      type,
      timestamp: serverTimestamp(),
      date_string: dateKey,
      day_number: dayNumber,
      time_slot: timeSlot,
      created_at_local: now.toISOString()
    };

    await addDoc(collection(db, 'users', uid, 'trigger_logs'), payload);

  } catch (error) {
    console.error("Critical error saving trigger log:", error);
    throw error;
  }
};
