// Importaciones necesarias
import React from 'react';
import styled from 'styled-components';
import { DateTime } from 'luxon';
import { Receipt } from './Receipt';
import { UpdateProductModal } from '../../component/modals/UpdateProduct/UpdateProductModal';

// Estilos
const Container = styled.div`
  max-width: 400px;
 
`;

// Componente de recibo de compras
const ReciboCompras = (props, ref) => {
 

  return (

        <UpdateProductModal isOpen={true}></UpdateProductModal>

  );
};

export default React.forwardRef(ReciboCompras);
