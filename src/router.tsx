import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBrowserRouter, Outlet, useLocation, useNavigate } from 'react-router';
import { scan } from 'react-scan';

import { DeveloperSessionHelper } from './components/devtools/DeveloperSessionHelper';
import { ViewportContainer } from './components/layout/ViewportContainer/ViewportContainer';
import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import { selectUser } from './features/auth/userSlice';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useHydrateTaxReceiptSettings } from './features/taxReceipt/useHydrateTaxReceiptSettings';
import { useAutomaticLogin } from './firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { useUserDocListener } from './firebase/Auth/fbAuthV2/fbSignIn/updateUserData';
import { useInitializeBillingSettings } from './firebase/billing/useInitializeBillingSettings';
import { useCurrentCashDrawer } from './firebase/cashCount/useCurrentCashDrawer';
import { useRealtimePresence } from './firebase/presence/useRealtimePresence';
import { useFbTaxReceiptToggleStatus } from './firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import { useLoadUserAbilities, useAbilities } from './hooks/abilities/useAbilities';
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

const NavigationTracker = () => {
  useNavigationTracker();
  return null;
};

const AppLayout = ({ blockContent }) => {
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const user = useSelector(selectUser);

  // Permitir selección de texto solo para desarrolladores
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isDev = user?.role === 'dev';
    document.body.style.userSelect = isDev ? 'auto' : 'none';
    return () => {
      document.body.style.userSelect = '';
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }, [user?.role]);

  useTaxReceiptsFix();
  useDeveloperCommands();
  usePersistentDeveloperBusiness();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting());
  }, [dispatch]);

  useInitializeBillingSettings();

  // scan({
  //   enabled: true,
  //   log: true,
    
  // });

  useLoadUserAbilities();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  useUserDocListener(user?.uid);
  useRealtimePresence(user);
  useCurrentCashDrawer();
  useAbilities();
  useAutoCreateDefaultTaxReceipt();
  useHydrateTaxReceiptSettings();
  useFbTaxReceiptToggleStatus();
  useBusinessDataConfig();
  useCheckForInternetConnection();

  if (blockContent) {
    return null;
  }

  return (
    <ViewportContainer>
      <DeveloperSessionHelper />
      <NavigationTracker />
      <SEO />
      <AnimatePresence mode="wait">
        <Outlet />
      </AnimatePresence>
      <AnimatePresence>
        <ModalManager />
      </AnimatePresence>
      <NotificationCenter />
    </ViewportContainer>
  );
};


const RootElement = () => {
  const { status: bootStatus, error: bootError } = useAutomaticLogin();
  const user = useSelector(selectUser) as unknown;
  const location = useLocation();
  const navigate = useNavigate();

  const isChecking = bootStatus === 'checking';
  const isPublicRoute =
    location.pathname === '/' || location.pathname === '/login';
  const shouldRedirectToHome =
    !isChecking && bootStatus === 'ready' && user && isPublicRoute;

  useEffect(() => {
    if (shouldRedirectToHome) {
      void navigate('/home', { replace: true });
    }
  }, [shouldRedirectToHome, navigate]);

  const blockContent = isChecking && !user;

  return (
    <>
      <SessionManager status={bootStatus} error={bootError as Error | null} />
      <AppLayout blockContent={blockContent} />
    </>
  )
}


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootElement />,
    children: routes.map(route => ({
      ...route,
      element: route.element,
      children: route.children ? route.children.map(child => ({
        ...child,
        element: child.element
      })) : undefined
    }))
  }
]);
