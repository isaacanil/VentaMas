import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './routes/routes';
import { SessionManager } from './views/templates/system/SessionManager';
import { useAutomaticLogin } from './firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from './features/auth/userSlice';
import { useEffect } from 'react';
import { useNavigationTracker } from './hooks/routes/useNavigationTracker';
import { ViewportContainer } from './components/layout/ViewportContainer/ViewportContainer';
import { DeveloperSessionHelper } from './components/devtools/DeveloperSessionHelper';
import SEO from './Seo/Seo';
import { ModalManager } from './views/component/modals/ModalManager';
import NotificationCenter from './views/templates/NotificationCenter/NotificationCenter';
import { AnimatePresence } from 'framer-motion';
import { useTaxReceiptsFix } from './hooks/useTaxReceiptsFix';
import { useDeveloperCommands } from './hooks/useDeveloperCommands';
import { usePersistentDeveloperBusiness } from './hooks/usePersistentDeveloperBusiness';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useInitializeBillingSettings } from './firebase/billing/useInitializeBillingSettings';
import { scan } from 'react-scan';
import { useLoadUserAbilities, useAbilities } from './hooks/abilities/useAbilities';
import { useUserDocListener } from './firebase/Auth/fbAuthV2/fbSignIn/updateUserData';
import { useRealtimePresence } from './firebase/presence/useRealtimePresence';
import { useCurrentCashDrawer } from './firebase/cashCount/useCurrentCashDrawer';
import { useAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import { useHydrateTaxReceiptSettings } from './features/taxReceipt/useHydrateTaxReceiptSettings';
import { useFbTaxReceiptToggleStatus } from './firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';
import { Outlet, useNavigate, useLocation } from 'react-router';

const NavigationTracker = () => {
  useNavigationTracker();
  return null;
};

const AppLayout = () => {
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
  useDeveloperCommands();
  usePersistentDeveloperBusiness();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting());
  }, [dispatch]);

  useInitializeBillingSettings();

  scan({
    enabled: true,
    log: true,
  });

  useLoadUserAbilities();
  useUserDocListener(user?.uid);
  useRealtimePresence(user);
  useCurrentCashDrawer();
  useAbilities();
  useAutoCreateDefaultTaxReceipt();
  useHydrateTaxReceiptSettings();
  useFbTaxReceiptToggleStatus();
  useBusinessDataConfig();
  useCheckForInternetConnection();

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
          {blockContent ? null : <AppLayout />}
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
