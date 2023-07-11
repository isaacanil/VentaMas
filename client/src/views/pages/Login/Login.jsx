import React, {useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'

//component
import {
   Button,
   
} from '../../index'
//style

import LoginStyle from './Login.module.scss'

//redux
import { useDispatch } from 'react-redux'
import { login } from '../../../features/auth/userSlice';

//firebase
import {
   auth,
 }from '../../../firebase/firebaseconfig.jsx'
import { signInWithEmailAndPassword } from 'firebase/auth'
import findRouteByName from '../../templates/MenuApp/findRouteByName'
import ROUTES_NAME from '../../../routes/routesName'
import styled from 'styled-components'

//APP
export const Login = () => {
   const dispatch = useDispatch()
   const Navigate = useNavigate()

   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const {HOME} = ROUTES_NAME.BASIC_TERM
   const homePath = findRouteByName(HOME).path

   const loginToApp = (e) => {
     e.preventDefault()
      console.log(email, password)
      //Sign in an existing user with Firebase
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredencial)=>{
        const user = userCredencial.user
        dispatch(login({
          email: user.email,
          uid: user.uid,
          displayName: user.displayName
        }))
        Navigate(homePath)
      })
      .catch((error)=>{
         alert(error.message)
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage)
      })
      //returns  an auth object after a successful authentication
      //userAuth.user contains all our user details
        
    };
    console.log(email, password)
   


   return (
      <div className={LoginStyle.Container_app}>
         <section className={LoginStyle.Login_Wrapper}>
            <div className={LoginStyle.Login_header}>
               <div className={LoginStyle.WebName}>
                  <span>Ventamax</span>
               </div>
               <span className={LoginStyle.Title}>Acceder</span>
            </div>
            <div className={LoginStyle.LoginControl_Container}>
               <form className={LoginStyle.FormControl}>
                  <div className={LoginStyle.FormItemGroup}>
                     <label htmlFor="" className={LoginStyle.FormLabel}>Usuario:</label>
                     <input 
                     className={LoginStyle.FormInput} 
                     type="text"
                     placeholder='Email:'
                     onChange={(e)=>setEmail(e.target.value)}
                      />
                  </div>
                  <div className={LoginStyle.FormItemGroup}>
                     <label
                        className={LoginStyle.FormLabel}
                        htmlFor=""  
                        >Contraseña:
                     </label>

                     <input 
                     className={LoginStyle.FormInput} 
                     type="password"
                     placeholder='Contraseña:'
               
                     onChange={(e)=>setPassword(e.target.value)} />

                     <Link  className={LoginStyle.FormForgetPasswordInput} to='/'>¿Olvidaste la Contraseña?</Link>
                  </div >
                  <div>
                     <Button onClick={loginToApp} title={'Entrar'}/>
                  </div>
               </form>
            </div>
         </section>
      </div>
   )
}
const Backdrop = styled.div`
`
const Container = styled.div`
   
`