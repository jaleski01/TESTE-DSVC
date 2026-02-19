
import React from 'react';

// Design System Constants
export const COLORS = {
  Background: 'transparent',      
  Surface: 'rgba(15, 10, 21, 0.6)', 
  Border: '#2E243D',          
  Primary: '#8B5CF6',         
  Danger: '#FF1744',          
  TextPrimary: '#FFFFFF',     
  TextSecondary: '#9CA3AF',   
  Cyan: '#A78BFA',            
  Success: '#10B981',
  Warning: '#F59E0B',
  Gold: '#F59E0B' 
};

export enum Routes {
  LOGIN = '/',
  ONBOARDING = '/onboarding',
  DASHBOARD = '/dashboard',
  PROGRESS = '/progress',
  LEARNING = '/learning',
  PROFILE = '/profile',
  SOS = '/sos',
  SUPPORT = '/support',
}

export interface UserProfile {
  victory_mode?: string;
  focus_pillar?: string;
  current_streak_start?: string;
  addiction_score?: number;
  onboarding_completed?: boolean;
  daily_addiction_minutes?: number;
  created_at?: string;
  email?: string | null;
  last_updated?: any; 
  lastCheckInDate?: string;
  seen_fact_ids?: number[];
  selected_habits?: string[];
  last_epitaph_date?: string;
  [key: string]: any;
}

export interface EpitaphLog {
  id?: string;
  date: string;
  day_number: number;
  content: string;
  created_at: any;
}

export interface DailyMission {
  id: string;
  label: string;
  desc: string;
}

export const DAILY_MISSIONS: DailyMission[] = [
  { id: 'm1', label: 'Contato Visual', desc: 'Faça contato visual e sorria para um desconhecido hoje.' },
  { id: 'm2', label: 'Estar Presente', desc: 'Faça uma refeição inteira sem nenhuma tela por perto.' },
  { id: 'm3', label: 'Aterramento', desc: 'Caminhe descalço na grama ou terra por 5 minutos.' },
  { id: 'm4', label: 'Respiração Focada', desc: 'Faça 5 minutos apenas prestando atenção na sua respiração.' },
  { id: 'm5', label: 'Conversa Real', desc: 'Ligue para um amigo ou familiar apenas para saber como ele está.' },
  { id: 'm6', label: 'Jejum de Áudio', desc: 'Faça um trajeto (carro/ônibus/caminhada) em silêncio absoluto, sem música ou podcast.' },
  { id: 'm7', label: 'Banho de Choque', desc: 'Termine seu banho com 30 segundos de água 100% gelada.' },
  { id: 'm8', label: 'Micro-Organização', desc: 'Arrume sua cama assim que levantar.' },
  { id: 'm9', label: 'Luz Natural', desc: 'Exponha seus olhos à luz do sol nos primeiros 30 minutos após acordar.' },
  { id: 'm10', label: 'Desconexão Noturna', desc: 'Desligue o celular 1 hora antes de dormir.' },
  { id: 'm11', label: 'Leitura Tátil', desc: 'Leia 10 páginas de um livro físico (nada de telas).' },
  { id: 'm12', label: 'Alongamento', desc: 'Faça 5 minutos de alongamento focado na tensão dos ombros e pescoço.' },
  { id: 'm13', label: 'Elogio Sincero', desc: 'Elogie o trabalho ou atitude de alguém pessoalmente.' },
  { id: 'm14', label: 'Escrita de Clareza', desc: 'Escreva 3 coisas pelas quais você é grato hoje em um papel.' },
  { id: 'm15', label: 'Observação', desc: 'Sente-se em um local público e apenas observe o ambiente por 10 minutos.' },
  { id: 'm16', label: 'Movimento Intenso', desc: 'Faça o máximo de flexões ou agachamentos que conseguir em 2 minutos.' },
  { id: 'm17', label: 'Hidratação Máxima', desc: 'Beba 500ml de água logo ao acordar.' },
  { id: 'm18', label: 'Voz Alta', desc: 'Cante ou fale em voz alta uma afirmação positiva no espelho.' },
  { id: 'm19', label: 'Abraço Longo', desc: 'Dê um abraço de no mínimo 10 segundos em alguém que você ama.' },
  { id: 'm20', label: 'Estudo Ativo', desc: 'Aprenda um conceito novo que não tenha relação com seu trabalho.' },
  { id: 'm21', label: 'Desapego', desc: 'Limpe seu ambiente de trabalho, jogue fora papéis e lixo.' },
  { id: 'm22', label: 'Ajuda Espontânea', desc: 'Ofereça ajuda em uma pequena tarefa a alguém da sua casa ou trabalho.' },
  { id: 'm23', label: 'Tédio Voluntário', desc: 'Fique 10 minutos deitado olhando para o teto, sem fazer nada.' },
  { id: 'm24', label: 'Ritmo Cardíaco', desc: 'Suba e desça escadas por 3 minutos sem parar.' },
  { id: 'm25', label: 'Conexão Animal', desc: 'Brinque com um animal de estimação focando 100% nele.' },
  { id: 'm26', label: 'Micro-Gentileza', desc: 'Segure a porta ou dê passagem para alguém.' },
  { id: 'm27', label: 'Cozinha Consciente', desc: 'Prepare uma refeição simples prestando atenção aos cheiros e texturas.' },
  { id: 'm28', label: 'Sair da Bolha', desc: 'Caminhe por uma rua ou bairro que você não costuma passar.' },
  { id: 'm29', label: 'Limpeza de Dopamina', desc: 'Exclua um aplicativo do celular que faz você perder tempo.' },
  { id: 'm30', label: 'Arte Analógica', desc: 'Desenhe, pinte ou escreva algo livremente por 10 minutos no papel.' },
  { id: 'm31', label: 'Zero Açúcar', desc: 'Passe o dia de hoje sem consumir açúcar refinado.' },
  { id: 'm32', label: 'Contato Frio', desc: 'Lave o rosto com água gelada sempre que sentir ansiedade.' },
  { id: 'm33', label: 'Redução Visual', desc: 'Coloque a tela do seu celular no modo Preto e Branco por 24h.' },
  { id: 'm34', label: 'Respiração Box', desc: 'Faça 3 ciclos de respiração: 4s inspira, 4s segura, 4s expira, 4s segura.' },
  { id: 'm35', label: 'Postura de Poder', desc: 'Mantenha a coluna reta e peito aberto propositalmente por 5 minutos.' },
  { id: 'm36', label: 'Checagem de Postura', desc: 'Ajuste sua postura toda vez que pegar no celular hoje.' },
  { id: 'm37', label: 'Espera Paciente', desc: 'Fique em uma fila ou espere algo sem puxar o celular do bolso.' },
  { id: 'm38', label: 'Interesse Genuíno', desc: 'Faça uma pergunta profunda a alguém e ouça sem interromper.' },
  { id: 'm39', label: 'Sem Reclamações', desc: 'Passe as próximas 12 horas sem reclamar de absolutamente nada.' },
  { id: 'm40', label: 'Solitude', desc: 'Vá a um café ou praça e tome algo sozinho, sem pressa.' },
  { id: 'm41', label: 'Desafio Mental', desc: 'Faça uma palavra-cruzada, sudoku ou jogo de lógica analógico.' },
  { id: 'm42', label: 'Cura pelo Som', desc: 'Ouça uma música clássica ou instrumental de olhos fechados por 5 min.' },
  { id: 'm43', label: 'Reconhecimento', desc: 'Mande uma mensagem para alguém agradecendo por algo do passado.' },
  { id: 'm44', label: 'Caminhada Rápida', desc: 'Dê uma volta de 15 minutos pelo quarteirão em ritmo acelerado.' },
  { id: 'm45', label: 'Ato de Coragem', desc: 'Tome uma decisão que você está adiando por medo ou ansiedade.' }
];

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}
