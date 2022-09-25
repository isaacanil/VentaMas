import { useEffect } from 'react';

//importando componentes de react-router-dom
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

//redux config
import { useDispatch, useSelector } from 'react-redux'

// todo ***user*********
import { login, logout, selectUser } from './features/auth/userSlice'
import { SelectProduct } from './features/cart/cartSlice'
import { auth, onAuthStateChanged } from './firebase/firebaseconfig'

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
  Receipt


} from './views/index'
import { Fragment } from 'react';
import { useModal } from './hooks/useModal'
import { PDFViewer } from '@react-pdf/renderer'
function App() {

  const dispatch = useDispatch();
  const user = useSelector(selectUser)
  const products = useSelector(SelectProduct)
  const cart = useSelector((state)=> state.cart)
 
 
  //Todo ******detectando si hay usuarios logueados******
  useEffect(() => {
    onAuthStateChanged(auth, (userAuth) => {
      if (userAuth) {
        const { email, uid, displayName } = userAuth
        dispatch(
          login({
            email,
            uid,
            displayName,
          })

        );
      } else { dispatch(logout()) }
    })
  }, [])
  if (user === false) {
    return <h2>Loading</h2>
  }
  return (
    <Fragment>
      <Router>
        <ModalManager></ModalManager>

        <Routes>
          <Route exact path='/register' element={<Register />}></Route>
          <Route exact path='/login' element={<Login />}></Route>
          <Route exact path='/' element={<Welcome />}></Route>
          <Route exact path='*' element={<NotFound />}></Route>


          <Route exact path='/app/compra' element={
            <RequireAuth>
              <CompraPage></CompraPage>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/checkout/receipt' element={
            <RequireAuth>
              <PDFViewer style={{width: "100%", height: "99vh"}}>
                <Receipt data={cart}></Receipt>
              </PDFViewer>
            </RequireAuth>
          }>
          </Route>




          <Route path='/app/contact/*' element={<Contact></Contact>} >
            <Route path='cliente' element={
              <CompraPage></CompraPage>
            }></Route>
            <Route path='proveedor' element={<h2>Proveedor</h2>}></Route>
          </Route>
          <Route exact path='/app/venta' element={
            <RequireAuth>
              <VentaPage></VentaPage>
            </RequireAuth>
          }>
          </Route>
          <Route exact path='/app/' element={
            <RequireAuth>
              <Home></Home>
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
