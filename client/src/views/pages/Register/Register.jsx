import React, { useState } from 'react'
import {InputText, InputPassword, Button} from '../../index'
import {HandleRegister} from '../../../firebase/firebaseconfig'


import { useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';

export const Register = () => {
 
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  HandleRegister(name, email, pass, confirmPass)
  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={HandleRegister}>
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
