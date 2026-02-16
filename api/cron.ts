
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
  /**
   * SECURITY GUARD (PROTEÇÃO VERCEL CRON)
   * Verifica se a requisição possui o token de autorização secreto.
   */
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(`[Security] Tentativa de acesso não autorizado bloqueada.`);
    return res.status(401).end('Unauthorized');
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  
  // Feature Flag: Segurança para não enviar em massa durante testes se não desejar
  const isProduction = process.env.ENABLE_REAL_NOTIFICATIONS === 'true';

  // 1. Definição de Contexto Temporal (Brasil UTC-3)
  const now = new Date();
  
  // Ajusta o horário do servidor (UTC) para o horário de Brasília (UTC-3)
  // Subtrai 3 horas em milissegundos
  const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  
  // Formata para YYYY-MM-DD para comparar com lastCheckInDate
  const todayStr = brazilTime.toISOString().split('T')[0];

  // Cooldown: Não enviar se já enviou nas últimas 20h (evita spam no mesmo dia)
  const notificationCooldown = new Date(now.getTime() - (20 * 60 * 60 * 1000));

  console.log(`[Cron Job] Iniciando rotina. Data Brasil: ${todayStr}. Hora Server: ${now.toISOString()}`);

  try {
    // 2. Busca no Firestore (Reengajamento Diário)
    // LÓGICA: Se lastCheckInDate < todayStr, significa que o usuário 
    // fez check-in ontem ou antes, mas NÃO HOJE.
    // O operador '<' exclui automaticamente documentos onde o campo não existe ou é null.
    const snapshot = await db.collection('users')
      .where('lastCheckInDate', '<', todayStr)
      .get();
    
    if (snapshot.empty) {
      return res.status(200).json({ status: 'Todos os usuários já fizeram check-in hoje ou base vazia.', mode: isProduction ? 'PRODUCTION' : 'SIMULATION' });
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
      
      // Validação 1: Usuário tem token?
      if (!userData.fcm_token) return;

      // Validação 2: Cooldown (Já enviou hoje?)
      if (userData.last_notification_sent_at) {
        // Suporte híbrido: Se for Timestamp do Firestore converte para Date, se não assume Date/String
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
            // 3. Envio Real
            await messaging.send({
              token: userData.fcm_token,
              notification: { 
                title: "Comece o dia vencendo ☀️", 
                body: "Mantenha sua ofensiva em dia. Um check-in agora garante sua vitória." 
              },
              data: { 
                route: '/dashboard',
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              },
              android: {
                priority: 'high',
                notification: {
                  clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                }
              },
              apns: {
                payload: {
                  aps: {
                    contentAvailable: true,
                  },
                },
              },
            });

            // 4. Atualização de Controle
            await doc.ref.update({ 
              last_notification_sent_at: admin.firestore.FieldValue.serverTimestamp() 
            });
            
            console.log(`[PRODUÇÃO] Notificação enviada para: ${userId}`);
            results.sent++;
          } else {
            // Modo Simulação
            console.log(`[SIMULAÇÃO] Enviaria para ${userId} (Último check-in: ${userData.lastCheckInDate})`);
            results.sent++;
          }

        } catch (error: any) {
          results.errors++;
          // console.error(`Erro ao enviar para ${userId}:`, error.code);

          // 5. Tratamento de Erro (Limpeza de Base)
          if (
            error.code === 'messaging/registration-token-not-registered' || 
            error.code === 'messaging/invalid-argument'
          ) {
            await doc.ref.update({ fcm_token: admin.firestore.FieldValue.delete() });
            results.tokens_removed++;
            console.log(`[CLEANUP] Token removido para usuário ${userId}`);
          }
        }
      };

      promises.push(processNotification());
    });

    await Promise.all(promises);
    
    return res.json({ 
      status: 'Success', 
      mode: isProduction ? 'PRODUCTION' : 'SIMULATION',
      target_date: todayStr,
      stats: results
    });

  } catch (error: any) { 
    console.error("Erro Crítico no Cron:", error);
    return res.status(500).json({ error: 'Runtime processing error', details: error.message }); 
  }
}
