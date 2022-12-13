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
 }from '../../../firebase/firebaseconfig.js'
import { signInWithEmailAndPassword } from 'firebase/auth'

//APP
export const Login = () => {
   
   
   const dispatch = useDispatch()
   const Navigate = useNavigate()

   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const loginToApp = (e) => {
      e.preventDefault();
  
      // Sign in an existing user with Firebase
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredencial)=>{
        const user = userCredencial.user
        dispatch(login({
          email: user.email,
          uid: user.uid,
          displayName: user.displayName
        }))
        Navigate('/app/')
      })
      .catch((error)=>{
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage)
      })
      // returns  an auth object after a successful authentication
      // userAuth.user contains all our user details
        
    };
   


   return (
      <div className={LoginStyle.Container_app}>
         <section className={LoginStyle.Login_Wrapper}>

            <div className={LoginStyle.Login_header}>
               <div className={LoginStyle.WebName}>
                  <span>VentaMAX</span>

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
                       
                        >
                        Contraseña:
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

