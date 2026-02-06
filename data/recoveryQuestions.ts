export interface RecoveryQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const RECOVERY_QUESTIONS: RecoveryQuestion[] = [
  {
    id: 1,
    question: "O que acontece com os receptores de dopamina após picos constantes de estímulos artificiais?",
    options: [
      "Eles se multiplicam para absorver mais prazer.",
      "Eles sofrem 'downregulation' (diminuem), causando tolerância.",
      "Eles se transformam em serotonina.",
      "O cérebro para de produzir eletricidade."
    ],
    correctIndex: 1,
    explanation: "O cérebro reduz os receptores para se proteger da sobrecarga, exigindo doses maiores para sentir o mesmo prazer."
  },
  {
    id: 2,
    question: "Qual região do cérebro é responsável pelo controle de impulsos e tomada de decisões racionais?",
    options: [
      "Amígdala Cerebelar.",
      "Córtex Occipital.",
      "Córtex Pré-Frontal.",
      "Tronco Encefálico."
    ],
    correctIndex: 2,
    explanation: "O Córtex Pré-Frontal age como o 'freio' do cérebro. O vício enfraquece essa região."
  },
  {
    id: 3,
    question: "Segundo a neurociência, quanto tempo o cérebro leva, em média, para realizar um 'reset' básico de dopamina?",
    options: [
      "24 horas.",
      "7 dias.",
      "21 a 30 dias.",
      "6 meses."
    ],
    correctIndex: 2,
    explanation: "Cerca de 3 a 4 semanas são necessárias para que os níveis básicos de homeostase comecem a se estabilizar."
  },
  {
    id: 4,
    question: "O 'Loop do Hábito' (Charles Duhigg) é composto por quais elementos, nesta ordem?",
    options: [
      "Ação, Recompensa e Gatilho.",
      "Gatilho, Rotina e Recompensa.",
      "Desejo, Foco e Vitória.",
      "Pensamento, Erro e Lição."
    ],
    correctIndex: 1,
    explanation: "Identificar o gatilho e a recompensa permite que você alterne a rotina para quebrar o ciclo."
  },
  {
    id: 5,
    question: "O que caracteriza o fenômeno conhecido como 'Névoa Mental' (Brain Fog) no vício digital?",
    options: [
      "Aumento da capacidade de memorização.",
      "Dificuldade de concentração e raciocínio lento por excesso de estímulo.",
      "Uma técnica de meditação avançada.",
      "Melhora na visão periférica."
    ],
    correctIndex: 1,
    explanation: "A névoa mental é o esgotamento dos recursos cognitivos devido à busca incessante por novidade digital."
  }
];

export const getRandomRecoverySet = (count: number = 3): RecoveryQuestion[] => {
  const shuffled = [...RECOVERY_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
