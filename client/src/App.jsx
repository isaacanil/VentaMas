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
  Ventas as VentaPage,
  Compras as CompraPage,
  Inventario as InventarioPage,
  Setting,
  TaxReceiptSetting,
  MultimediaManager,
  Registro as RegistroPage,
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
import { Collection } from './views/pages/Collection'
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
import BusinessInfo from './views/pages/setting/subPage/ClientInfo/ClientInfo';
import SalesReport from './views/pages/Reports/ReportsSale';
import { Feedback } from './views/pages/Feedback/FeedbackShorter';
import { FeedbackChat } from './views/pages/Feedback/FeedbackChat';
import { ChatBox } from './views/component/ChatBox/ChatBox';
import { AddProductAndServicesModal } from './views/component/modals/AddProduct&Services/AddProduct&Services';
import { OrderDetails } from './views/component/modals/OrderDetailModal/OrderDetailModal';
import { ProductOutflow } from './views/pages/Inventario/pages/ProductOutflow/ProductOutflow';
import { BarcodeParser } from 'barcode-parser';
import useBarcodeScanner from './hooks/barcode/usebarcodescanner';

function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser)
  const products = useSelector(SelectProduct)
  const cart = useSelector((state) => state.cart)
  //Todo ******detectando si hay usuarios logueados******
  useEffect(() => {
    AuthStateChanged(dispatch)
    dispatch(ReloadImageHiddenSetting())
  }, [])

  const isConnected = useCheckForInternetConnection()
  console.log(isConnected)
  if (user === false || user === !null) {
    return <GenericLoader></GenericLoader>
  }


  return (
    <Fragment>
      <Router>
        <ModalManager></ModalManager>
        <Routes >
          {/* <Route  path='/app/set-custom-product-modal/' element={<SetCustomProduct />}/> */}
          <Route path='/app/freeSpace/' element={<FreeSpace />} />
          {/* <Route path='/app/feedback' element={<ChatBox  />}/> */}
          {/* <Route path='/app/feedback' element={<HomeScreen />} /> */}
          <Route path='/app/receipt/' element={<Receipt />} />
          <Route path='/app/setting/business-info' element={<BusinessInfo />} />
          <Route path='/app/settings/' element={<Setting />} />
          <Route path='/app/setting/tax-receipt' element={<TaxReceiptSetting />} />
          <Route path='/app/setting/app-info' element={<AppInfo />} />
          <Route path='/app/create-custom-product-modal/' element={<AddCustomProductModal />} />
          {/* <Route path='/register' element={<Register />}></Route> */}
          <Route path='/login' element={<Login />}></Route>
          <Route path='/' element={<Welcome />} ></Route>
          <Route path='/collection' element={<Collection />}></Route>
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
          <Route path='/app/pedido/' element={<Orders />}>
          </Route>
          <Route path='/app/contact/client' element={<ClientAdmin />} />
          <Route path='/app/contact/provider' element={<ProviderAdmin />} />
          <Route path='/app/sale/1' element={
            <RequireAuth>
              <VentaPage />
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
          <Route path='/app/category' element={
            <RequireAuth>
              <CategoryAdmin></CategoryAdmin>
            </RequireAuth>
          }>
          </Route>
          <Route path='/app/inventario/items' element={
            <RequireAuth>
              <InventarioPage></InventarioPage>
            </RequireAuth>
          }/>
           <Route path='/app/inventario/product-outflow' element={
            <RequireAuth>
              <ProductOutflow />
            </RequireAuth>
          }/> 
          <Route path='/app/inventario/multimedia_manager' element={<MultimediaManager />}>
          </Route>
          <Route e></Route>
          <Route path='/app/sign-up' element={
            // <RequireAuth>
              <SignUp></SignUp>
            // </RequireAuth>
          }>
          </Route>
        </Routes>
      </Router>
      <AlertHandler></AlertHandler>
    </Fragment>
  );
}

export default App;
