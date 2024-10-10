
import React, { useRef, useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { Receipt } from '../../../pages/checkout/Receipt';
import invoice from './data.json'
import styled from 'styled-components';
import { useGetWarehouseData } from '../../../../hooks/warehouse/useGetWarehouseData';
import { fbFixProductsWithoutId } from '../../../../firebase/products/fbFixProductsWithoutId';
const { FloatButton } = antd

export const Prueba = () => {
  const user = useSelector(selectUser)

  const handleSubmit = async () => {
    // try {
    //   await fbFixProductsWithoutId(user)
    //   console.log("Subido exitosamente")
    // } catch (error) {
    //   console.error("Error al arreglar ids de productos ", error)
    // }
  }


  return (
    <Container>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur tenetur tempore, consequatur nisi nulla veniam autem perferendis ex ut at illo dolore incidunt ipsum! Amet, perspiciatis. Aut mollitia doloremque molestiae.
      {/* <Receipt data={invoice} ignoreHidden={true} />  */}
      {/* <FloatButton onClick={handleSubmit}>Corregir productos sin Id</FloatButton> */}
    </Container>
  )
}

const Container = styled.div`

`
