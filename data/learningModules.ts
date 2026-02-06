export interface LearningStep {
  text: string;
  isCopyable?: boolean;
  copyValue?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  intro?: string;
  
  // Design System Properties
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;

  // Milestone Properties
  isSpecialReward?: boolean;
  videoUrl?: string;
  requiredStreak?: number;

  // Content
  androidSteps?: LearningStep[];
  iosSteps?: LearningStep[];
}

export const LEARNING_MODULES: LearningModule[] = [
  // --- RECOMPENSAS DE MARCO (BLOQUEADAS POR STREAK) ---
  {
    id: 'reward_3d',
    title: 'O Efeito Coolidge',
    subtitle: 'A ciência da novidade (Vídeo Exclusivo)',
    category: 'RECOMPENSA 3D',
    icon: 'play',
    gradientStart: '#B45309', // Dourado escuro (base)
    gradientEnd: '#FBBF24',   // Dourado claro (brilho)
    accentColor: '#FDE047',   // Amarelo vibrante para bordas/ícones
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

  // --- CONTEÚDO PADRÃO ---
  {
    id: 'dns_shield',
    title: 'O Escudo Invisível (DNS)',
    subtitle: 'Bloqueio de conteúdo adulto na raiz da rede.',
    category: 'Bloqueio Técnico',
    icon: 'shield',
    gradientStart: '#0B101A',
    gradientEnd: '#112240',
    accentColor: '#A78BFA',
    intro: 'O DNS Family da Cloudflare bloqueia requisições a sites adultos na raiz da rede.',
    androidSteps: [
      { text: 'Abra as Configurações do seu Android.' },
      { text: 'Vá em "Rede e Internet" ou "Conexões".' },
      { text: 'Toque em "DNS Privado".' },
      { text: 'Selecione a opção "Nome do host do provedor de DNS privado".' },
      { text: 'family.cloudflare-dns.com', isCopyable: true, copyValue: 'family.cloudflare-dns.com' },
      { text: 'Toque em Salvar.' }
    ],
    iosSteps: [
      { text: 'Abra os Ajustes e toque em "Wi-Fi".' },
      { text: 'Toque no ícone (i) azul.' },
      { text: 'Role até o final e toque em "Configurar DNS".' },
      { text: 'Mude de "Automático" para "Manual".' },
      { text: '1.1.1.3', isCopyable: true, copyValue: '1.1.1.3' },
      { text: '1.0.0.3', isCopyable: true, copyValue: '1.0.0.3' },
      { text: 'Toque em "Salvar".' }
    ]
  },
  {
    id: 'art_dopa',
    title: 'Dessensibilização Dopaminérgica',
    subtitle: 'A biologia por trás da perda de prazer em coisas reais.',
    category: 'ARTIGOS',
    icon: 'document',
    gradientStart: '#000000',
    gradientEnd: '#1F2937',
    accentColor: '#9CA3AF',
    intro: 'O excesso de estímulos supranormais causa uma regulação negativa nos receptores D2.'
  },
  {
    id: 'art_libido',
    title: 'O Mito da Libido',
    subtitle: 'Diferenciando vontade sexual real de fissura química.',
    category: 'ARTIGOS',
    icon: 'document',
    gradientStart: '#000000',
    gradientEnd: '#1F2937',
    accentColor: '#9CA3AF',
    intro: 'Muitas vezes, o que interpretamos como "alta libido" é na verdade o sistema de recompensa gritando por dopamina.'
  },
  {
    id: 'pod_rescue',
    title: 'Protocolo de Resgate: Dia 1',
    subtitle: 'O que fazer nas primeiras 24h de abstinência.',
    category: 'PODCASTS',
    icon: 'mic',
    gradientStart: '#0F0A15',
    gradientEnd: '#2E1065',
    accentColor: '#8B5CF6',
    intro: 'Um guia de áudio passo a passo para sobreviver às primeiras e mais difíceis 24 horas.'
  }
];