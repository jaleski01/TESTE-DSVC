
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Telas
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { LearningScreen } from './screens/LearningScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SosScreen } from './screens/SosScreen';
import { SupportScreen } from './screens/SupportScreen';

// Componentes
import { Routes as AppRoutes } from './types';
import { NotificationManager } from './components/NotificationManager';
import { DataSyncManager } from './components/DataSyncManager';
import { DataProvider } from './contexts/DataContext';
import { TabLayout } from './components/TabLayout';

const AppContent: React.FC<{ user: any; isOnboardingComplete: boolean }> = ({ user, isOnboardingComplete }) => {
  const location = useLocation();

  const showTabBar = user && isOnboardingComplete && (
    location.pathname === AppRoutes.DASHBOARD ||
    location.pathname === AppRoutes.PROGRESS ||
    location.pathname === AppRoutes.LEARNING ||
    location.pathname === AppRoutes.PROFILE
  );

  return (
    <>
      <div key={location.pathname} className="animate-page-transition w-full flex-1 flex flex-col overflow-hidden bg-transparent">
        {user && <DataSyncManager />}
        
        <Routes location={location}>
          <Route 
            path={AppRoutes.LOGIN} 
            element={user ? (isOnboardingComplete ? <Navigate to={AppRoutes.DASHBOARD} replace /> : <Navigate to={AppRoutes.ONBOARDING} replace />) : <LoginScreen />} 
          />
          <Route 
            path={AppRoutes.SUPPORT} 
            element={<SupportScreen />} 
          />
          <Route 
            path={AppRoutes.ONBOARDING} 
            element={user ? (isOnboardingComplete ? <Navigate to={AppRoutes.DASHBOARD} replace /> : <OnboardingScreen />) : <Navigate to={AppRoutes.LOGIN} replace />} 
          />
          
          {/* Rotas Protegidas (Autenticação + Onboarding Completo) */}
          <Route element={user && isOnboardingComplete ? <Outlet /> : <Navigate to={user ? AppRoutes.ONBOARDING : AppRoutes.LOGIN} replace />}>
            <Route path={AppRoutes.DASHBOARD} element={<DashboardScreen />} />
            <Route path={AppRoutes.PROGRESS} element={<ProgressScreen />} />
            <Route path={AppRoutes.LEARNING} element={<LearningScreen />} />
            <Route path={AppRoutes.PROFILE} element={<ProfileScreen />} />
          </Route>

          <Route 
            path={AppRoutes.SOS} 
            element={user ? <SosScreen /> : <Navigate to={AppRoutes.LOGIN} replace />} 
          />
          <Route path="*" element={<Navigate to={AppRoutes.LOGIN} replace />} />
        </Routes>
      </div>

      {showTabBar && <TabLayout />}
    </>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.ready.then(registration => {
          console.log('[PWA] Service Worker pronto.');
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        });
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // Verificação de Assinatura
            const status = userData?.subscription_status;
            const blockedStatuses = ['canceled', 'unpaid', 'past_due'];

            if (status && blockedStatuses.includes(status)) {
              await signOut(auth);
              setUser(null);
              setIsOnboardingComplete(false);
            } else {
              setUser(currentUser);
              setIsOnboardingComplete(!!userData?.onboarding_completed);
            }
          } else {
            // Usuário novo sem documento no Firestore
            setUser(currentUser);
            setIsOnboardingComplete(false);
          }
        } else {
          setUser(null);
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Erro na validação de sessão:", error);
        setUser(currentUser); 
      } finally {
        setLoading(false);
      }
    });

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      unsubscribe();
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (loading) {
    return (
      <div 
        className="h-[100dvh] w-full flex flex-col items-center justify-center text-white overflow-hidden bg-void relative"
      >
        {/* Background Atmosphere */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mb-4 relative z-10"></div>
        <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase animate-pulse relative z-10">
          Validando Protocolo
        </span>
      </div>
    );
  }

  return (
    <HashRouter>
      <DataProvider>
        <NotificationManager />
        <AppContent user={user} isOnboardingComplete={isOnboardingComplete} />
      </DataProvider>
    </HashRouter>
  );
};

export default App;
