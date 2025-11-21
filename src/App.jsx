import { AnimatePresence } from 'framer-motion';
import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { scan } from 'react-scan'; // import this BEFORE react

//importando componentes de react-router-dom

//redux config

import DeveloperSessionHelper from './components/devtools/DeveloperSessionHelper';
import { ViewportContainer } from './components/layout/ViewportContainer/ViewportContainer';
import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import { selectUser } from './features/auth/userSlice';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useHydrateTaxReceiptSettings } from './features/taxReceipt/useHydrateTaxReceiptSettings';
import { useAutomaticLogin } from './firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { useUserDocListener } from './firebase/Auth/fbAuthV2/fbSignIn/updateUserData';
import { useBackfillUserNumbers } from './firebase/Auth/fbBackfillUserNumbers';
import { useInitializeBillingSettings } from './firebase/billing/useInitializeBillingSettings';
import { useCurrentCashDrawer } from './firebase/cashCount/useCurrentCashDrawer';
import { useRealtimePresence } from './firebase/presence/useRealtimePresence';
import { useFixTaxReceiptWithoutId } from './firebase/Settings/taxReceipt/fbFixTaxReceiptWithoutId';
import { useFbTaxReceiptToggleStatus } from './firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import {
  useAbilities,
  useLoadUserAbilities,
} from './hooks/abilities/useAbilities';
import { useNavigationTracker } from './hooks/routes/useNavigationTracker';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';
import { useDeveloperCommands } from './hooks/useDeveloperCommands';
import { usePersistentDeveloperBusiness } from './hooks/usePersistentDeveloperBusiness';
import { useTaxReceiptsFix } from './hooks/useTaxReceiptsFix';
import { routes } from './routes/routes';
import SEO from './Seo/Seo';
import { ModalManager } from './views/component/modals/ModalManager';
import NotificationCenter from './views/templates/NotificationCenter/NotificationCenter';
import { SessionManager } from './views/templates/system/SessionManager';

// Componente para rastrear la navegación dentro del Router
const NavigationTracker = () => {
  useNavigationTracker();
  return null;
};

function App() {
  return (
    <Fragment>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ViewportContainer>
          <BootstrapManager />
        </ViewportContainer>
      </Router>
    </Fragment>
  );
}

const BootstrapManager = () => {
  const { status: bootStatus, error: bootError } = useAutomaticLogin();
  return <AppShell bootStatus={bootStatus} bootError={bootError} />;
};

const AppShell = ({ bootStatus, bootError }) => {
  const user = useSelector(selectUser);
  const location = useLocation();
  const navigate = useNavigate();

  const isChecking = bootStatus === 'checking';
  const isPublicRoute =
    location.pathname === '/' || location.pathname === '/login';
  const shouldRedirectToHome =
    !isChecking && bootStatus === 'ready' && user && isPublicRoute;

  useEffect(() => {
    if (shouldRedirectToHome) {
      navigate('/home', { replace: true });
    }
  }, [shouldRedirectToHome, navigate]);

  const blockContent = isChecking && !user;

  return (
    <>
      <SessionManager status={bootStatus} error={bootError} />
      {blockContent ? null : <AppContent />}
    </>
  );
};

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  // Permitir selección de texto solo para desarrolladores
  useEffect(() => {
    const isDev = user?.role === 'dev';
    document.body.style.userSelect = isDev ? 'auto' : 'none';
    return () => {
      document.body.style.userSelect = '';
    };
  }, [user?.role]);

  useTaxReceiptsFix();
  useDeveloperCommands(); // Activar comandos de desarrollador
  usePersistentDeveloperBusiness(); // Mantener negocio temporal entre sesiones

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting());
  }, [dispatch]);

  useInitializeBillingSettings();

  scan({
    enabled: true,
    log: true, // logs render info to console (default: false)
  });

  useLoadUserAbilities(); // Carga las habilidades del usuario actual

  useBackfillUserNumbers();

  useUserDocListener(user?.uid); // escucha los cambios en el documento del usuario actual

  useRealtimePresence(user);

  useCurrentCashDrawer(); // obtiene el cajón actual

  useAbilities(); // establece la abilidad que puede usar el usuario actual
  useAutoCreateDefaultTaxReceipt(); // crea el comprobante fiscal por defecto

  // Hidratar taxReceiptEnabled desde localStorage tan pronto como sea posible.
  useHydrateTaxReceiptSettings();

  useFbTaxReceiptToggleStatus(); // obtiene el estado del comprobante fiscal

  useFixTaxReceiptWithoutId();

  useBusinessDataConfig(); // obtiene la configuración de la empresa

  useCheckForInternetConnection(); // verifica la conexión a internet

  return (
    <>
      <DeveloperSessionHelper />
      <NavigationTracker />
      <SEO />
      <AnimatePresence mode="wait">
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element}>
              {route.children &&
                route.children.map((childRoute, childIndex) => (
                  <Route
                    key={childIndex}
                    path={childRoute?.path}
                    element={childRoute?.element}
                  />
                ))}
            </Route>
          ))}
        </Routes>
      </AnimatePresence>
      <AnimatePresence>
        <ModalManager />
      </AnimatePresence>
      <NotificationCenter />
    </>
  );
};

export default App;
