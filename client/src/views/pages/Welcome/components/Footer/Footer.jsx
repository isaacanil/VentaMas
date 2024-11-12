// Importa React, styled-components y los componentes de antd que necesitarás
import React from 'react';
import styled from 'styled-components';
import * as antd from 'antd';



// Componente Footer
export const Footer = () => {
  return (
    <FooterContainer>
      <Row justify="center">
        <Col>
          <FooterText>© {new Date().getFullYear()} Ventamax - Todos los derechos reservados</FooterText>
        </Col>
      </Row>
      <Row justify="center" style={{ marginTop: '10px' }}>
        <Col>
          <FooterText>Desarrollado por Gisys</FooterText>
        </Col>
      </Row>
    </FooterContainer>
  );
};


// Crea estilos personalizados para tu footer usando styled-components
const FooterContainer = styled.footer`
  background-color: #f0f2f5;
  border-top: 1px solid #e8e8e8;
  padding: 20px 0;
  margin-top: 2em;
  text-align: center;
`;

const FooterText = styled.p`
  color: #666;
  margin: 0;
  font-size: 16px;
`;
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;

`;
const Col = styled.div`
  flex: 0 0 100%;
  max-width: 100%;
  position: relative;
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
`;