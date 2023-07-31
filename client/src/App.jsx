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

//const router = createBrowserRouter(routes)

function App() {
  const dispatch = useDispatch();

  useAutomaticLogin();

  AuthStateChanged();

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting())
  }, [])

  const user = useSelector(selectUser)
  const sessionToken = localStorage.getItem('sessionToken');

  useGetUserData(user?.uid)

  useAbilities()// establece la abilidad que puede usar el usuario actual

  fbAutoCreateDefaultTaxReceipt()

  useBusinessDataConfig()

  useFullScreen()

  useCheckForInternetConnection()

  if (user === false) { return <GenericLoader /> }

  return (

    <Fragment>
      <Router>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element}>
              {route.children && route.children.map((childRoute, childIndex) => (
                <Route key={childIndex} path={childRoute.path} element={childRoute.element} />
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
