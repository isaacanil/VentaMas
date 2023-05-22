import { useEffect, useState } from 'react';

//A*******************pruyeba************************

//importando componentes de react-router-dom
import { createBrowserRouter, Routes, Route, useNavigate, Navigate, HashRouter, useRoutes, RouterProvider } from 'react-router-dom';

//redux config
import { useDispatch, useSelector } from 'react-redux'

// todo ***user*********
import { login, logout, selectUser } from './features/auth/userSlice'

import { AuthStateChanged } from './firebase/firebaseconfig'

import { Fragment } from 'react';
import { useModal } from './hooks/useModal'
import { GenericLoader } from './views/templates/system/loader/GenericLoader';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';

import { useFullScreen } from './hooks/useFullScreen';


import useGetUserData from './firebase/Auth/useGetUserData';
import { fbGetTaxReceipt } from './firebase/taxReceipt/fbGetTaxReceipt';
import { fbAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';

import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import { routes } from './routes/routes';

'./firebase/Auth/useGetUserData';

function App() {
  const dispatch = useDispatch();

  AuthStateChanged()

  useEffect(() => {
    dispatch(ReloadImageHiddenSetting())
  }, [])

  const user = useSelector(selectUser)

  useGetUserData(user?.uid)

  fbAutoCreateDefaultTaxReceipt()

  useBusinessDataConfig()

  useFullScreen()

  //const isConnected = useCheckForInternetConnection()
  if (user === false) {
    return <GenericLoader></GenericLoader>
  }
  const router = createBrowserRouter(routes)
  return (

    <Fragment>
      <RouterProvider router={router} />
    </Fragment>
  )

}

export default App;
