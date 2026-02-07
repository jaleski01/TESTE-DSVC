
import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const AppTour: React.FC = () => {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const tourCompleted = localStorage.getItem('onboarding_tour_completed');
    if (!tourCompleted) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('onboarding_tour_completed', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: '#tour-timer',
      content: (
        <div style={{ textAlign: 'left', color: '#1a1a1a' }}>
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>⏱️ Tempo de Liberdade</strong>
          <p>Este é o seu cronômetro de sobriedade. Ele marca quanto tempo você está longe do vício. <b>Se recair, ele zera.</b> Mantenha-o rodando!</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-habits',
      content: (
        <div style={{ textAlign: 'left', color: '#1a1a1a' }}>
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>🔥 Sua Ofensiva</strong>
          <p>Aqui você registra suas vitórias diárias e gatilhos. Marque sempre ao final do dia para aumentar sua ofensiva e liberar prêmios exclusivos.</p>
        </div>
      ),
    },
    {
      target: '#tour-neuro',
      content: (
        <div style={{ textAlign: 'left', color: '#1a1a1a' }}>
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>🧠 Reality Check</strong>
          <p>Complete os desafios diários para ganhar pontos e prêmios especiais. Volte todo dia para evoluir sua mente e garantir sua pontuação.</p>
        </div>
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#8B5CF6',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          textColor: '#333333',
        },
        buttonNext: {
          backgroundColor: '#8B5CF6',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '4px',
        },
        buttonBack: {
          color: '#8B5CF6',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Vamos lá!',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
};

export default AppTour;
