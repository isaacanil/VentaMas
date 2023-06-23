import React, { useState } from 'react';
import styled from 'styled-components';

const RegistroContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1em;
  form {
      max-width: 600px;
        width: 100%;
        padding: 1em;
  }
  background-color: #f2f2f2;
`;

const Titulo = styled.h2`
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
`;

const CampoFormulario = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const EtiquetaCampo = styled.label`
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 1.2rem;
`;

const CampoInput = styled.input`
  padding: 0.4em;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const MensajeError = styled.p`
  color: red;
  margin-top: 0.5rem;
  font-size: 1rem;
`;

const BotonRegistro = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const Registro = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleNombreChange = (e) => {
    setNombre(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/\d/.test(password)) {
      setPasswordError('La contraseña debe contener al menos un número.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setPasswordError(
        'La contraseña debe contener al menos una letra mayúscula.'
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      setPasswordError(
        'La contraseña debe contener al menos una letra minúscula.'
      );
      return;
    }

    // Aquí puedes realizar alguna lógica de registro con los datos ingresados
    console.log('Nombre:', nombre);
    console.log('Email:', email);
    console.log('Contraseña:', password);
  };

  return (
    <RegistroContainer>
      <Titulo>Registro</Titulo>
      <form onSubmit={handleSubmit}>
        <CampoFormulario>
          <EtiquetaCampo>Nombre:</EtiquetaCampo>
          <CampoInput
            type="text"
            value={nombre}
            onChange={handleNombreChange}
            required
          />
        </CampoFormulario>
        <CampoFormulario>
          <EtiquetaCampo>Email:</EtiquetaCampo>
          <CampoInput
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </CampoFormulario>
        <CampoFormulario>
          <EtiquetaCampo>Contraseña:</EtiquetaCampo>
          <CampoInput
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          {passwordError && <MensajeError>{passwordError}</MensajeError>}
        </CampoFormulario>
        <BotonRegistro type="submit">Registrarse</BotonRegistro>
      </form>
    </RegistroContainer>
  );
};

export default Registro;
