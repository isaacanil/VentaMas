import React, { useState } from 'react'
import { InputText, InputPassword, Button } from '../../index'
import { HandleRegister } from '../../../firebase/firebaseconfig.jsx'


import { useNavigate } from 'react-router-dom';

import styled from 'styled-components';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { InputV4 } from '../../templates/system/Inputs/InputV4.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../../features/notification/NotificationSlice';
import { validationRules } from '../../templates/system/Inputs/validationRules';

export const SignUp = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    verifyPassword: '',
    active: true
  });
  const { name, email, password, verifyPassword } = user;

  const dispatch = useDispatch();

  const handleRegister = (e) => {
    e.preventDefault();
    if(name === '') return dispatch(addNotification({type: 'error', message: 'El nombre no puede estar vacío'}));
    if(email === '') return dispatch(addNotification({type: 'error', message: 'El email no puede estar vacío'}));
    if(password === '') return dispatch(addNotification({type: 'error', message: 'La contraseña no puede estar vacía'}));
    if(verifyPassword === '') return dispatch(addNotification({type: 'error', message: 'La contraseña no puede estar vacía'}));
    if(password !== verifyPassword) return dispatch(addNotification({type: 'error', message: 'Las contraseñas no coinciden'}));

    HandleRegister(name, email, password, verifyPassword, navigate)
  };
console.log(name, email, password, verifyPassword)
  return (
    <FormContainer>
      <FormHeader>Sign Up</FormHeader>
      <Form>
        <FormGroup>
          <InputV4
            label='Name'
            icon={<FaUser />}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e)=> setUser({...user, name: e.target.value})}
          />
        </FormGroup>
        <FormGroup>
          <InputV4
            label='Email'
            icon={<FaEnvelope />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=> setUser({...user, email: e.target.value})}
            required
          />
        </FormGroup>
        <FormGroup>
          <InputV4
            label='Password'
            icon={<FaLock />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=> setUser({...user, password: e.target.value})}
            validate={password === verifyPassword}
            validationRules={validationRules}
            alertMessage="Las contraseñas no coinciden"
          />
        </FormGroup>
        <FormGroup>
          <InputV4
            label='Verify Password'
            icon={<FaLock />}
            type="password"
            placeholder="Verify Password"
            value={verifyPassword}
            onChange={(e)=> setUser({...user, verifyPassword: e.target.value})}
            validate={password === verifyPassword ? "pass" : "fail"}
            validationRules={validationRules}
            alertMessage="Las contraseñas no coinciden"
          />
        </FormGroup>
        <Button
          bgcolor='primary'
          title={'Guardar'}
          onClick={(e)=>handleRegister(e)}    
        />
      </Form>
    </FormContainer>
  );
};

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormHeader = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
`;

const FormGroup = styled.div`

  
  width: 100%;
  max-width: 400px;
  margin-bottom: 0.4rem;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: #ccc;
  margin-right: 1rem;
`;

const Input = styled.input`
  flex: 1;
  height: 50px;
  border: none;
  padding: 0 1rem;
  font-size: 1.2rem;
`;


