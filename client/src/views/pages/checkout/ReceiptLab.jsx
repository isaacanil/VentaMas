// Importaciones necesarias
import React from 'react';
import styled from 'styled-components';
import { DateTime } from 'luxon';
import { Receipt } from './Receipt';
import { UpdateProductModal } from '../../component/modals/UpdateProduct/UpdateProductModal';
import Typography from '../../templates/system/Typografy/Typografy';
import Article from '../../templates/system/Article/Article';


// Estilos


// Componente de recibo de compras
const ReciboCompras = (props, ref) => {
  const articleSections = [
    {
      title: 'Introducing ChatGPT Enterprise (August 28, 2023)',
      rawText: '[Today](/Hola) we’re launching __ChatGPT Enterprise__, which offers **enterprise-grade** security and privacy, unlimited ~~higher-speed~~ GPT-4 access, longer context windows for processing longer inputs, advanced data analysis capabilities, customization options, and much more. \nChatGPT Enterprise also provides unlimited access to Advanced Data Analysis, previously known as __Code Interpreter__. \nLearn more on our website and connect with our sales team to get started.',
    },
   
    // ... más secciones
  ];
//como seria Release Notes en español?              
  return (
    <Container>
      <Article 
      title="Ventamax — Notas de la versión" 
      sections={articleSections} 
      />
    </Container>
  );
};

export default React.forwardRef(ReciboCompras);

const Container = styled.div`
  max-width: 650px;

`