
import React, { useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { Receipt } from '../../../pages/checkout/Receipt';
import invoice from './data.json'
import styled from 'styled-components';
const { message } = antd

export const Prueba = () => {
  const user = useSelector(selectUser)

  const handleSubmit = async () => {}

  return (
    <Container>
      <Receipt data={invoice} ignoreHidden={true} /> 
    </Container>
  )
}

const Container = styled.div`

`
