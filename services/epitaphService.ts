
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EpitaphLog } from '../types';

/**
 * Salva um novo registro de Epitáfio e atualiza o perfil do usuário.
 */
export const saveEpitaph = async (uid: string, content: string, dayNumber: number) => {
  const today = new Date().toLocaleDateString('en-CA');

  // 1. Salva o Log na Subcoleção
  await addDoc(collection(db, 'users', uid, 'epitaph_logs'), {
    content,
    day_number: dayNumber,
    date: today,
    created_at: serverTimestamp()
  });

  // 2. Atualiza a flag no User Profile para bloquear novos registros hoje
  await updateDoc(doc(db, 'users', uid), {
    last_epitaph_date: today,
    last_updated: serverTimestamp()
  });
};

/**
 * Busca o histórico de Epitáfios ordenado por data (mais recente primeiro).
 */
export const getEpitaphHistory = async (uid: string): Promise<EpitaphLog[]> => {
  const q = query(
    collection(db, 'users', uid, 'epitaph_logs'),
    orderBy('created_at', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as EpitaphLog));
};

/**
 * Chama a Serverless Function para gerar o insight com IA.
 * Segurança: Não expõe chaves, apenas envia os textos.
 */
export const fetchEvolutionInsight = async (logs: EpitaphLog[]): Promise<string | null> => {
  try {
    // Pega apenas os últimos 5 logs para contexto recente
    const recentLogs = logs.slice(0, 5).map(l => ({
      date: l.date,
      day_number: l.day_number,
      content: l.content
    }));

    const response = await fetch('/api/epitaph-insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs: recentLogs })
    });

    if (!response.ok) {
      throw new Error('Falha na análise da IA');
    }

    const data = await response.json();
    return data.insight;

  } catch (error) {
    console.error("Erro ao buscar insight:", error);
    return null;
  }
};
