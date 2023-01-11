import { useEffect, useState } from 'react';

//importando componentes de react-router-dom
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, HashRouter } from 'react-router-dom';

//redux config
import { useDispatch, useSelector } from 'react-redux'

// todo ***user*********
import { login, logout, selectUser } from './features/auth/userSlice'
import { SelectProduct, } from './features/cart/cartSlice'
import { AuthStateChanged } from './firebase/firebaseconfig'
import { Category } from './views/pages/category/Category';
//páginas y componentes
import {
  Welcome,
  Home,
  NotFound,
  Login,
  Register,
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

} from './views/index'
import { Collection } from './views/pages/Collection'
import { Fragment } from 'react';
import { useModal } from './hooks/useModal'
import { DeleteProductAlert } from './views/templates/system/Alerts/DeleteProductAlert'
import { GenericLoader } from './views/templates/system/loader/GenericLoader';
import { ReloadImageHiddenSetting } from './features/setting/settingSlice';
import { useCheckForInternetConnection } from './hooks/useCheckForInternetConnection';
import { getTaxReceiptData} from './features/taxReceipt/taxReceiptSlice';
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
  if (user === false) {
    return <GenericLoader></GenericLoader>
  }
  
  return (
    <Fragment>
      <Router>
        <ModalManager></ModalManager>
        <Routes >
          {/* <Route  path='/app/set-custom-product-modal/' element={<SetCustomProduct />}/> */}
          <Route path='/app/setting/' element={<Setting />} />
          <Route path='/app/setting/tax-receipt' element={<TaxReceiptSetting/>}/>
          <Route path='/app/create-custom-product-modal/' element={<AddCustomProductModal />} />
          <Route path='/register' element={<Register />}></Route>
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
          <Route path='/app/contact/client' element={<CompraPage></CompraPage>} />
          <Route path='/app/contact/provider' element={<h2>Proveedor</h2>} />
          <Route path='/app/venta' >
            <Route path=':displayID' element={
              <RequireAuth>
                <VentaPage></VentaPage>
              </RequireAuth>
            } ></Route>
          </Route>
          <Route path='/app/category' element={
            <RequireAuth>
              <Category></Category>
            </RequireAuth>
          }>
          </Route>
          <Route path='/app/category/add' element={
            <RequireAuth>
              <AddCategory></AddCategory>
            </RequireAuth>
          }>
          </Route>
          <Route path='/app/inventario/items' element={
            <RequireAuth>
              <InventarioPage></InventarioPage>
            </RequireAuth>
          }>
          </Route>
          <Route path='/app/inventario/multimedia_manager' element={<MultimediaManager />}>

          </Route>
          <Route e></Route>
          <Route path='/app/registro' element={
            <RequireAuth>
              <RegistroPage></RegistroPage>
            </RequireAuth>
          }>
          </Route>
        </Routes>
      </Router>
      <AlertHandler></AlertHandler>

    </Fragment>
  );
}

export default App;
