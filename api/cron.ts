
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
  const now = new Date();
  
  // Feature Flag: Segurança para não enviar em massa durante testes se não desejar
  const isProduction = process.env.ENABLE_REAL_NOTIFICATIONS === 'true';
  
  // 1. Definição de Timestamps de Corte
  // Inatividade: Usuários que não atualizam o perfil há mais de 24h.
  // IMPORTANTE: O campo last_updated é usado como referência principal de atividade.
  const inactivityThreshold = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  // Cooldown: Não enviar se já enviou nas últimas 20h (evita spam diário excessivo se o cron rodar múltiplas vezes)
  const notificationCooldown = new Date(now.getTime() - (20 * 60 * 60 * 1000));

  try {
    // 2. Busca no Firestore
    // Buscamos usuários cujo 'last_updated' é antigo (anterior ao threshold de 24h).
    // O Firestore lida bem com a comparação de Timestamps. Se o campo for string ISO, 
    // a comparação léxica também funciona na maioria dos casos, mas o ideal é consistência.
    const snapshot = await db.collection('users')
      .where('last_updated', '<', inactivityThreshold)
      .get();
    
    if (snapshot.empty) {
      return res.status(200).json({ status: 'No inactive users found', mode: isProduction ? 'PRODUCTION' : 'SIMULATION' });
    }

    const results = {
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
                title: "Lembrete de Hábito", 
                body: "Mantenha sua ofensiva. Um pequeno passo hoje garante sua vitória." 
              },
              data: { 
                route: '/dashboard',
                click_action: 'FLUTTER_NOTIFICATION_CLICK' // Padrão para compatibilidade
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
            console.log(`[SIMULAÇÃO] Enviaria para ${userId}: "Mantenha sua ofensiva..."`);
            results.sent++;
          }

        } catch (error: any) {
          results.errors++;
          console.error(`Erro ao enviar para ${userId}:`, error.code);

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
      stats: results
    });

  } catch (error: any) { 
    console.error("Erro Crítico no Cron:", error);
    return res.status(500).json({ error: 'Runtime processing error', details: error.message }); 
  }
}
