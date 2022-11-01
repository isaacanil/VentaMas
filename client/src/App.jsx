import { useEffect } from 'react';

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
  Registro as RegistroPage,
  RequireAuth,
  Contact,
  ModalManager,
  Receipt,
  AddCategory,
  Orders,
  AddCustomProductModal,
  SetCustomProduct

} from './views/index'
import { Collection } from './views/pages/Collection'
import { Fragment } from 'react';
import { useModal } from './hooks/useModal'


function App() {

  const dispatch = useDispatch();
  const user = useSelector(selectUser)
  const products = useSelector(SelectProduct)
  const cart = useSelector((state) => state.cart)
  //Todo ******detectando si hay usuarios logueados******
  useEffect(() => {
    AuthStateChanged(dispatch)


  }, [])
  if (user === false) {
    return <h2>Loading</h2>
  }



  // 
  return (
    <Fragment>
      <Router>
        <ModalManager></ModalManager>
        <Routes >
          {/* <Route  path='/app/set-custom-product-modal/' element={<SetCustomProduct />}/> */}
          <Route path='/app/create-custom-product-modal/' element={<AddCustomProductModal />} />
          <Route exact path='/register' element={<Register />}></Route>
          <Route exact path='/login' element={<Login />}></Route>
          <Route exact path='/'  element={<Welcome />} ></Route>
          <Route exact path='/collection' element={<Collection />}></Route>
          <Route exact path='*' element={<NotFound />}></Route>
          <Route exact path='/app/compra' element={
            <RequireAuth>
              <CompraPage></CompraPage>
            </RequireAuth>
          }>
          </Route>

          <Route exact path='/app/' element={
            <RequireAuth>
              <Home></Home>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/pedido/' element={<Orders />}>

          </Route>
          <Route path='/app/contact/client' element={<CompraPage></CompraPage>} />
          <Route path='/app/contact/provider' element={<h2>Proveedor</h2>} />
          <Route exact path='/app/venta' >
            <Route path=':displayID' element={
              <RequireAuth>
                <VentaPage></VentaPage>
              </RequireAuth>
            } ></Route>
          </Route>
          <Route exact path='/app/category' element={
            <RequireAuth>
              <Category></Category>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/category/add' element={
            <RequireAuth>
              <AddCategory></AddCategory>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/inventario' element={
            <RequireAuth>
              <InventarioPage></InventarioPage>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/registro' element={
            <RequireAuth>
              <RegistroPage></RegistroPage>
            </RequireAuth>
          }>
          </Route>
        </Routes>
      </Router>
    </Fragment>
  );
}

export default App;
