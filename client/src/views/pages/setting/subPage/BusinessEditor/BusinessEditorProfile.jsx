import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4';
import { fbUpdateBusinessInfo } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import { selectUser } from '../../../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { fbGetBusinessInfo } from '../../../../../firebase/businessInfo/fbGetBusinessInfo';
import { MenuApp } from '../../../..';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { set } from 'lodash';
import Typography from '../../../../templates/system/Typografy/Typografy';
import { fbAAddMultipleClients } from '../../../../../firebase/client/fbAddMultipleClients';

const BusinessInfo = () => {

  const business = useSelector(selectBusinessData)
  const [businessInfo, setBusinessInfo] = useState(business || {
    name: '',
    address: '',
    tel: '',
  });

  const user = useSelector(selectUser);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo({
      ...businessInfo,
      [name]: value,
    });
  };
  useEffect(() => {
    setBusinessInfo(business)
  }, [business])
  const handleSubmit = (event) => {
    event.preventDefault();
    if(!businessInfo?.name || !businessInfo?.address || !businessInfo?.tel) return alert('Completa todos los campos')
    fbUpdateBusinessInfo(user, businessInfo);
  };
  const metadata = {
    title: 'Información del negocio',
    description: 'Agrega la información de tu negocio, como nombre, dirección y teléfono. Esta información se utilizará en tus facturas.',
  }

  return (
    <Container>
      <MenuApp />
      <Form onSubmit={handleSubmit}>
        <Header>
          <Typography variant='h2'>Información del negocio</Typography>
          <Typography variant='p'>{metadata.description} </Typography>
         
        </Header>
        <Wrapper>
          <Group>
            <InputV4
              id="name"
              label='Nombre'
              placeholder="Nombre del negocio"
              type="text"
              name="name"
              value={businessInfo?.name}
              onChange={handleChange}
            />

          </Group>
          <Group>
            <InputV4
              id="address"
              label='Dirección'
              type="text"
              name="address"
              placeholder="Calle 123, Colonia, Ciudad, Estado"
              value={businessInfo?.address}
              onChange={handleChange}
            />
          </Group>
          <Group>
            <InputV4
              id="tel"
              label='Teléfono'
              type="text"
              name="tel"
              placeholder="55 1234 5678"
              value={businessInfo?.tel}
              onChange={handleChange}
            />
          </Group>
          <Button type="submit">Guardar</Button>
        </Wrapper>
      </Form>
    </Container>
  );
};

export default BusinessInfo;

const Container = styled.div``
const Header = styled.div`
max-width: 600px;
`
const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px;
  `;

const Group = styled.div`
  margin-top: 10px;
  margin-bottom: 1.4em;
  font-size: 16px;
  
  label{
    position: absolute;
    margin-top: -20px;
    font-size: 16px;
    
  }
  `;


const Button = styled.button`
  margin-top: 20px;
  padding: 10px;
  background-color: #007bff;
  border: none;
  color: #fff;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  `;
const Wrapper = styled.div`
max-width: 500px;
width: 100%;
display: grid;
gap: 1em;
margin-top: 3em;

`