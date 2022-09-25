import React, { useState } from 'react'
import {InputText, InputPassword, Button} from '../../index'
import { auth, createUserWithEmailAndPassword, updateProfile } from '../../../firebase/firebaseconfig'


import { useNavigate } from 'react-router-dom';

export const Register = () => {
 
  const Navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  

  const handleSubmit = (e) =>{
    e.preventDefault()
    if( pass === confirmPass ){
      createUserWithEmailAndPassword(auth, email, pass)
      .then(userAuth => {
        updateProfile(userAuth.user, {
          displayName: name,
        }).catch(error => console.log('user not updated'));
      }).catch(err => alert(err));
      Navigate('/login');
    }
    
  }
  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
      <div>
          <label htmlFor="">Name:  </label>
          <InputText
            type="text" 
            name="" 
            id=""
            placeholder='Nombre'
            onChange={e => setName(e.target.value)}/>
        </div>
        <br />
        <div>
          <label htmlFor="">Email:  </label>
          <InputText
            type="email" 
            name="" 
            id=""
            placeholder='ejemplo@gmail.com'
            onChange={e => setEmail(e.target.value)}/>
        </div>
        <br />
        <div>
          <label htmlFor="">Contraseña:  </label>
          
          <InputPassword
          type="password" 
          placeholder='Example1R9_0'
          onChange={e => setPass(e.target.value)}/>
        </div>
        <br />
        <div>
          <label htmlFor="">Repite la contraseña:  </label>
          <InputPassword 
          type="password" 
          placeholder='Example1R9_0'
          name="" 
          id="" 
          onChange={e => setConfirmPass(e.target.value)}/>
        </div>
        <Button>Crear</Button>
      </form>
    </div>
  )
}
