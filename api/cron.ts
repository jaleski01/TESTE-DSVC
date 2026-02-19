
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Inicialização Blindada do Firebase Admin
if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saVar) {
      admin.initializeApp({ 
        credential: admin.credential.cert(JSON.parse(saVar)) 
      });
    }
  } catch (e) {
    console.error("FATAL: Erro na configuração das credenciais do Firebase Admin.");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. DEFESA EM PROFUNDIDADE: Verificação de Método
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. DEFESA EM PROFUNDIDADE: Verificação de Segredo (Redundância ao Middleware)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error(`[Security] Bypass attempt or misconfiguration. Auth failed for Cron.`);
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  
  const isProduction = process.env.ENABLE_REAL_NOTIFICATIONS === 'true';
  const now = new Date();
  const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStr = brazilTime.toISOString().split('T')[0];
  const notificationCooldown = new Date(now.getTime() - (20 * 60 * 60 * 1000));

  console.log(`[Cron Job] Executando rotina segura. Data Brasil: ${todayStr}`);

  try {
    const snapshot = await db.collection('users')
      .where('lastCheckInDate', '<', todayStr)
      .get();
    
    if (snapshot.empty) {
      return res.status(200).json({ status: 'Check-ins em dia.', mode: isProduction ? 'PRODUCTION' : 'SIMULATION' });
    }

    const results = {
      candidates: snapshot.size,
      sent: 0,
      skipped_cooldown: 0,
      errors: 0,
      tokens_removed: 0
    };

    const promises: Promise<any>[] = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      if (!userData.fcm_token) return;

      if (userData.last_notification_sent_at) {
        const lastSentRaw = userData.last_notification_sent_at;
        const lastSent = lastSentRaw.toDate ? lastSentRaw.toDate() : new Date(lastSentRaw);
        
        if (lastSent > notificationCooldown) {
          results.skipped_cooldown++;
          return; 
        }
      }
      
      const processNotification = async () => {
        try {
          if (isProduction) {
            await messaging.send({
              token: userData.fcm_token,
              notification: { 
                title: "Comece o dia vencendo ☀️", 
                body: "Mantenha sua ofensiva em dia. Um check-in agora garante sua vitória." 
              },
              data: { 
                route: '/dashboard'
              }
            });

            await doc.ref.update({ 
              last_notification_sent_at: admin.firestore.FieldValue.serverTimestamp() 
            });
            results.sent++;
          } else {
            results.sent++;
          }
        } catch (error: any) {
          results.errors++;
          if (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-argument') {
            await doc.ref.update({ fcm_token: admin.firestore.FieldValue.delete() });
            results.tokens_removed++;
          }
        }
      };
      promises.push(processNotification());
    });

    await Promise.all(promises);
    
    return res.status(200).json({ 
      status: 'Success', 
      mode: isProduction ? 'PRODUCTION' : 'SIMULATION',
      stats: results
    });

  } catch (error: any) { 
    console.error("Erro Crítico no Cron:", error);
    return res.status(500).json({ error: 'Internal Server Error' }); 
  }
}
