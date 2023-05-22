import { useEffect, useState } from 'react';

//A*******************pruyeba************************

//importando componentes de react-router-dom
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, HashRouter } from 'react-router-dom';

//redux config
import { useDispatch, useSelector } from 'react-redux'

// todo ***user*********
import { login, logout, selectUser } from './features/auth/userSlice'
import { SelectProduct, } from './features/cart/cartSlice'
import { AuthStateChanged } from './firebase/firebaseconfig'

//páginas y componentes
import {
  Welcome,
  Home,
  NotFound,
  Login,
  SignUp,
  Sales,
  Compras as CompraPage,
  Inventory,
  Setting,
  TaxReceiptSetting,
  MultimediaManager,

  RequireAuth,
  Contact,
  ModalManager,
  Receipt,
  AddCategory,
  Orders,
  AddCustomProductModal,
  SetCustomProduct,
  AlertHandler,
  CategoryAdmin,
  ProviderAdmin,
  Registro

} from './views/index'
import { Fragment } from 'react';
import { useModal } from './hooks/useModal'
import { GenericLoader } from './views/templates/system/loader/GenericLoader';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';
import { getTaxReceiptData, IncreaseEndConsumer } from './features/taxReceipt/taxReceiptSlice';
import { ClientAdmin } from './views/pages/Contact/Client/ClientAdmin';
import { FreeSpace } from './FreeSpace';
import { useFullScreen } from './hooks/useFullScreen';
import AppInfo from './views/pages/setting/subPage/AppInfo/AppInfo';
import BusinessInfo from './views/pages/setting/subPage/BusinessEditor/BusinessEditor';
import SalesReport from './views/pages/Reports/ReportsSale';
import { Feedback } from './views/pages/Feedback/FeedbackShorter';
import { FeedbackChat } from './views/pages/Feedback/FeedbackChat';
import { ChatBox } from './views/component/ChatBox/ChatBox';
import { AddProductAndServicesModal } from './views/component/modals/AddProduct&Services/AddProduct&Services';
import { OrderDetails } from './views/component/modals/OrderDetailModal/OrderDetailModal';
import { ProductOutflow } from './views/pages/Inventario/pages/ProductOutflow/ProductOutflow';

import useGetUserData from './firebase/Auth/useGetUserData';
import { fbGetTaxReceipt } from './firebase/taxReceipt/fbGetTaxReceipt';
import { fbAutoCreateDefaultTaxReceipt } from './firebase/taxReceipt/fbAutoCreateDefaultReceipt';
import { AnimatePresence } from 'framer-motion';
import { useBusinessDataConfig } from './features/auth/useBusinessDataConfig';
import UserAdmin from './views/pages/setting/subPage/Users/UserAdmin';
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
  return (

    <Fragment>
      <Router>
        <ModalManager></ModalManager>
        <AnimatePresence mode="wait" initial={false}>
          <Routes >
            <Route path='/app/freeSpace/' element={
              <RequireAuth>
                <FreeSpace />
              </RequireAuth>
            } />
            <Route path='/app/receipt/' element={
              <RequireAuth>
                <Receipt />
              </RequireAuth>
            } />
            <Route path='/app/setting/business-info' element={
              <RequireAuth>
                <BusinessInfo />
              </RequireAuth>
            } />
            <Route path='/app/settings/' element={
              <RequireAuth>
                <Setting />
              </RequireAuth>
            } />
            <Route path='/app/setting/tax-receipt' element={
              <RequireAuth>
                <TaxReceiptSetting />
              </RequireAuth>
            } />
            <Route path='/app/setting/app-info' element={
              <RequireAuth>
                <AppInfo />
              </RequireAuth>
            } />
            <Route path='/app/setting/users' element={
              <RequireAuth>
                <UserAdmin />
              </RequireAuth>
            } />
            <Route path='/app/create-custom-product-modal/' element={
              <RequireAuth>
                <AddCustomProductModal />
              </RequireAuth>
            } />
            <Route path='/login' element={<Login />}></Route>
            <Route path='/' element={<Welcome />} ></Route>
            <Route path='*' element={<NotFound />}></Route>
            <Route path='/app/compra' element={
              <RequireAuth>
                <CompraPage></CompraPage>
              </RequireAuth>
            }>
            </Route>
            <Route path='/app/' element={
              <RequireAuth>
                <Home></Home>
              </RequireAuth>
            }>
            </Route>
            <Route path='/app/pedido/' element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }>
            </Route>
            <Route path='/app/contact/client' element={
              <RequireAuth>
                <ClientAdmin />
              </RequireAuth>
            } />
            <Route path='/app/contact/provider' element={<ProviderAdmin />} />
            <Route path='/app/sale/' element={
              <RequireAuth>
                <Sales />
              </RequireAuth>
            } />
            <Route path='/app/registro' element={
              <RequireAuth>
                <Registro />
              </RequireAuth>
            } />
            <Route path='/app/report/sales' element={
              <RequireAuth>
                <SalesReport />
              </RequireAuth>
            } />
            <Route path='/app/inventario/categories' element={
              <RequireAuth>
                <CategoryAdmin/>
              </RequireAuth>
            }>
            </Route>
            <Route path='/app/inventario/items' element={
              <RequireAuth>
                <Inventory />
              </RequireAuth>
            } />
            <Route path='/app/inventario/product-outflow' element={
              <RequireAuth>
                <ProductOutflow />
              </RequireAuth>
            } />
            <Route path='/app/inventario/multimedia_manager' element={
              <RequireAuth>
                <MultimediaManager />
              </RequireAuth>
            }>
            </Route>
            <Route path='/app/sign-up' element={
              // <RequireAuth>
              <SignUp></SignUp>
              // </RequireAuth>
            }>
            </Route>
          </Routes>
        </AnimatePresence>
      </Router>
      <AlertHandler></AlertHandler>
    </Fragment>
  )

}

export default App;
