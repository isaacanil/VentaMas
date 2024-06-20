import { Fragment, useEffect, useState } from 'react';

//importando componentes de react-router-dom
import { createBrowserRouter, RouterProvider, BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//redux config
import { useDispatch, useSelector } from 'react-redux'

// todo ***user*********
import { selectUser } from './features/auth/userSlice'

import { AuthStateChanged } from './firebase/firebaseconfig'

import { GenericLoader } from './views/templates/system/loader/GenericLoader';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';

import { useFullScreen } from './hooks/useFullScreen';

import useGetUserData from './firebase/Auth/useGetUserData';
import { fbGetTaxReceipt } from './firebase/taxReceipt/fbGetTaxReceipt';
import { fbAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';

import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import { routes } from './routes/routes';
import { useAbilities } from './hooks/abilities/useAbilities';
import { useAutomaticLogin } from './firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { ModalManager } from './views';
import { AnimatePresence } from 'framer-motion';
import { usefbTaxReceiptToggleStatus } from './firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus';
import { useUserDocListener } from './firebase/Auth/fbAuthV2/fbSignIn/updateUserData';
import { useCurrentCashDrawer } from './firebase/cashCount/useCurrentCashDrawer';
import { useTaxReceiptEnabledToCart } from './features/cart/thunk';

//const router = createBrowserRouter(routes)

function App() {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  useAutomaticLogin();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting())
  }, [])

  useTaxReceiptEnabledToCart();

  useUserDocListener(user?.uid); // escucha los cambios en el documento del usuario actual

  useGetUserData(user?.uid) // obtiene los datos del usuario actual

  useCurrentCashDrawer();// obtiene el cajón actual

  useAbilities()// establece la abilidad que puede usar el usuario actual

  fbAutoCreateDefaultTaxReceipt()// crea el comprobante fiscal por defecto

  usefbTaxReceiptToggleStatus()// obtiene el estado del comprobante fiscal

  useBusinessDataConfig()// obtiene la configuración de la empresa

  useFullScreen()// establece el modo pantalla completa

  useCheckForInternetConnection()// verifica la conexión a internet

  if (user === false) { return <GenericLoader /> }

  return (
    <Fragment>
      <Router>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element}>
              {route.children && route.children.map((childRoute, childIndex) => (
                <Route
                  key={childIndex}
                  path={childRoute?.path}
                  element={childRoute?.element}
                />
              ))}
            </Route>
          ))}
        </Routes>
        <AnimatePresence>
          <ModalManager />
        </AnimatePresence>
      </Router>
    </Fragment>
  )
}

export default App;
