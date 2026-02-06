import { Shield, FileText, Mic, Play, Activity } from 'lucide-react';

export interface LearningStep {
  text: string;
  isCopyable?: boolean;
  copyValue?: string;
}

export interface ContentItem {
  type: 'text' | 'list' | 'image';
  value: string | string[];
}

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: any; // Can be string or Lucide component
  intro?: string;
  
  // Design System Properties (Hybrid Support)
  gradientStart?: string;
  gradientEnd?: string;
  accentColor?: string;
  colors?: {
    start: string;
    end: string;
    text: string;
    accent: string;
  };

  // Metadata
  duration?: string;
  locked?: boolean;

  // Milestone Properties
  isSpecialReward?: boolean;
  videoUrl?: string;
  requiredStreak?: number;

  // DNS Specific Fields (Restored)
  dnsProvider?: string;
  androidSteps?: string[];
  iosSteps?: string[];

  // NeuroTabs Field for interactive content
  neuroTabs?: {
    title: string;
    description: string;
  }[];

  // Content (Hybrid Support)
  content?: ContentItem[];
}

export const LEARNING_MODULES: LearningModule[] = [
  // --- RECOMPENSAS DE MARCO (BLOQUEADAS POR STREAK) ---
  {
    id: 'reward_3d',
    title: 'O Efeito Coolidge',
    subtitle: 'A ciência da novidade (Vídeo Exclusivo)',
    category: 'RECOMPENSA 3D',
    icon: 'play',
    gradientStart: '#B45309',
    gradientEnd: '#FBBF24',
    accentColor: '#FDE047',
    isSpecialReward: true,
    requiredStreak: 3,
    videoUrl: 'https://www.youtube.com/embed/wsj2rAXV0Tg?si=oePk45H__nu0sNlE&playsinline=1&rel=0&modestbranding=1',
    intro: 'O efeito Coolidge é um fenômeno biológico visto em quase todas as espécies de mamíferos, onde os machos exibem um desejo sexual renovado sempre que uma nova fêmea é introduzida.'
  },
  {
    id: 'reward_7d',
    title: 'Protocolo Sargento: Blindagem Mental',
    subtitle: 'Técnicas avançadas de estoicismo aplicadas.',
    category: 'RECOMPENSA 7D',
    icon: 'lock',
    gradientStart: '#0F172A',
    gradientEnd: '#334155',
    accentColor: '#94A3B8',
    isSpecialReward: true,
    requiredStreak: 7,
    intro: 'Conteúdo tático de nível Sargento focado em resistência psicológica sob alta pressão.'
  },
  {
    id: 'reward_15d',
    title: 'Arquivos do Tenente: Neuroplasticidade',
    subtitle: 'Como reescrever fisicamente seu cérebro.',
    category: 'RECOMPENSA 15D',
    icon: 'lock',
    gradientStart: '#1e1b4b',
    gradientEnd: '#4338ca',
    accentColor: '#818cf8',
    isSpecialReward: true,
    requiredStreak: 15,
    intro: 'Um mergulho técnico na capacidade do cérebro de se regenerar após anos de abuso químico.'
  },
  {
    id: 'reward_30d',
    title: 'Dossiê Major: O Estado de Flow',
    subtitle: 'Sublimação da energia sexual em poder.',
    category: 'RECOMPENSA 30D',
    icon: 'lock',
    gradientStart: '#450a0a',
    gradientEnd: '#991b1b',
    accentColor: '#f87171',
    isSpecialReward: true,
    requiredStreak: 30,
    intro: 'Instruções avançadas sobre como canalizar a energia de abstinência para hiper-foco profissional.'
  },
  {
    id: 'reward_90d',
    title: 'O Legado do Veterano',
    subtitle: 'O segredo final da liberdade absoluta.',
    category: 'CLASSIFICADO 90D',
    icon: 'lock',
    gradientStart: '#083344',
    gradientEnd: '#06b6d4',
    accentColor: '#22d3ee',
    isSpecialReward: true,
    requiredStreak: 90,
    intro: 'A graduação final. Onde o vício se torna uma memória e o propósito se torna o único guia.'
  },

  // --- MÓDULOS BASE (RESTAURADOS DO REPOSITÓRIO ANTIGO) ---

  // 1. BLOQUEIO TÉCNICO (DNS)
  {
    id: 'dns_shield',
    title: 'O Escudo Invisível',
    subtitle: 'Bloqueio de conteúdo adulto na raiz da rede (DNS).',
    category: 'BLOQUEIO TÉCNICO',
    duration: '5 min',
    icon: Shield,
    colors: { start: '#0B101A', end: '#112240', text: '#E2E8F0', accent: '#A78BFA' },
    locked: false,
    intro: 'O método mais eficaz para bloquear pornografia sem instalar apps pesados. O DNS age como um filtro na sua conexão.',
    dnsProvider: 'family.cloudflare-dns.com', 
    androidSteps: [
      'Abra as Configurações > Rede e Internet',
      'Toque em "DNS Privado"',
      'Selecione "Nome do host do provedor de DNS privado"',
      'Cole o endereço acima e salve'
    ],
    iosSteps: [
      'Baixe o perfil de configuração (Recomendado) ou:',
      'Ajustes > Wi-Fi > Ícone (i) na sua rede',
      'Configurar DNS > Manual',
      'Adicione os servidores: 1.1.1.3 e 1.0.0.3'
    ],
  },

  // 2. FERRAMENTAS (MOVIDO PARA O TOPO DOS MÓDULOS BASE)
  {
    id: 'tool_neurodebug',
    title: 'NeuroDebug',
    subtitle: 'Decodifique o que seu cérebro está sentindo.',
    category: 'FERRAMENTA',
    duration: 'Guia',
    icon: Activity,
    colors: { start: '#0B101A', end: '#112240', text: '#E2E8F0', accent: '#A78BFA' },
    locked: false,
    intro: 'Durante a recuperação, seu cérebro passará por fases químicas distintas. Use esta ferramenta para identificar e entender cada sintoma.',
    neuroTabs: [
      {
        title: 'Névoa Mental',
        description: 'A sensação de "nuvem" no pensamento é causada pela "downregulation" (diminuição) dos receptores de dopamina D2. Seu cérebro está se recalibrando. É temporário e sinaliza que a cura começou. Evite açúcar e durma mais para acelerar a clareza.'
      },
      {
        title: 'Ansiedade',
        description: 'Sem a dopamina artificial do vício, seu sistema nervoso fica hiperativo, aumentando o cortisol. Isso não é você, é a abstinência. A respiração diafragmática (4-7-8) e banhos frios são as ferramentas mais rápidas para "resetar" esse estado químico.'
      },
      {
        title: 'Fissura (Urge)',
        description: 'O sistema límbico está gritando por falta de estímulo. A fissura dura em média 15 a 20 minutos. Se você usar a técnica de "Urge Surfing" e não lutar contra ela, apenas observá-la, ela perderá a força. A fissura é um sinal de que as vias neurais do vício estão enfraquecendo.'
      },
      {
        title: 'Flatline',
        description: 'O momento mais perigoso. Sua libido some, a energia cai e você sente uma "morte emocional". Isso ocorre porque o cérebro cortou a sensibilidade para se proteger. NÃO TESTE SUA LIBIDO AQUI. A Flatline precede a maior fase de recuperação natural. Aguente firme.'
      }
    ]
  },

  // 3. ARTIGOS
  {
    id: 'art_dopa',
    title: 'Dessensibilização',
    subtitle: 'A perda de prazer nas coisas reais.',
    category: 'ARTIGO',
    duration: '8 min',
    icon: FileText,
    colors: { start: '#000000', end: '#1F2937', text: '#F3F4F6', accent: '#9CA3AF' },
    locked: false,
    intro: 'O excesso de estímulos causa "downregulation" nos receptores D2, gerando anedonia (incapacidade de sentir prazer).'
  },
  {
    id: 'art_libido',
    title: 'O Mito da Libido',
    subtitle: 'Vontade real vs. Fissura química.',
    category: 'ARTIGO',
    duration: '6 min',
    icon: FileText,
    colors: { start: '#000000', end: '#1F2937', text: '#F3F4F6', accent: '#9CA3AF' },
    locked: false,
    intro: 'O que interpretamos como "alta libido" muitas vezes é apenas o sistema de recompensa gritando por alívio de estresse.'
  },

  // 4. PODCASTS
  {
    id: 'pod_rescue',
    title: 'Protocolo de Resgate',
    subtitle: 'O que fazer nas primeiras 24h.',
    category: 'PODCAST',
    duration: '15 min',
    icon: Mic,
    colors: { start: '#0F0A15', end: '#2E1065', text: '#E9D5FF', accent: '#8B5CF6' },
    locked: false,
    intro: 'Guia passo a passo: Hidratação, exercício intenso e remoção de gatilhos.'
  },
  {
    id: 'pod_interview',
    title: 'Cérebro vs. Hiperestímulo',
    subtitle: 'O encolhimento do córtex pré-frontal.',
    category: 'PODCAST',
    duration: '20 min',
    icon: Mic,
    colors: { start: '#0F0A15', end: '#2E1065', text: '#E9D5FF', accent: '#8B5CF6' },
    locked: false,
    intro: 'Neurocientistas explainam como a neuroplasticidade permite reverter os danos físicos no cérebro.'
  },

  // 5. VÍDEOS
  {
    id: 'vid_huberman',
    title: 'Controle de Impulso',
    subtitle: 'Ferramentas visuais para parar a recaída.',
    category: 'VÍDEO',
    duration: '10 min',
    icon: Play,
    colors: { start: '#0B101A', end: '#112240', text: '#E0E7FF', accent: '#A78BFA' },
    locked: false,
    intro: 'Mecanismos como foco panorâmico para desativar o sistema de alerta e reduzir a impulsividade.'
  },
  {
    id: 'vid_habit',
    title: 'Anatomia do Hábito',
    subtitle: 'Quebrando o loop Gatilho-Ação-Recompensa.',
    category: 'VÍDEO',
    duration: '12 min',
    icon: Play,
    colors: { start: '#0B101A', end: '#112240', text: '#E0E7FF', accent: '#A78BFA' },
    locked: false,
    intro: 'Você não elimina um hábito, você o substitui mantendo o gatilho mas alterando a rotina.'
  }
];