import React from 'react';
import styled from 'styled-components';


export const InfoCard = ({ title, provider, condition, state, updatedAt, color }) => {
    return (
      <CardWrapper color={color}>
        <Title>{title}</Title>
        <div>
          <h2>Información del proveedor:</h2>
          <Info>Proveedor: {provider}</Info>
          {/* ... y así con el resto de la información de identificación */}
        </div>
        <div>
          <h2>Información de la condición:</h2>
          <Info>ID de la condición: {condition.id}</Info>
          <Info>Nombre de la condición: {condition.name}</Info>
          {/* ... y así con el resto de la información de la condición */}
        </div>
        <div>
          <h2>Información del estado del pedido:</h2>
          <Info>ID del estado: {state.id}</Info>
          <Info>Nombre del estado: {state.name}</Info>
          {/* ... y así con el resto de la información del estado del pedido */}
        </div>
        <div>
          <h2>Información de tiempo:</h2>
          <Info>Última actualización: {updatedAt}</Info>
          {/* ... y así con el resto */}
        </div>
      </CardWrapper>
    );
  };
  const CardWrapper = styled.div`
  background-color: ${({ color }) => color};
  border-radius: 10px;
  border: 2px solid ${({ color }) => color};
  margin-bottom: 20px;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 10px;
`;

const Info = styled.p`
  font-size: 1rem;
  margin-bottom: 5px;
`;
  const CardContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
  `;
  
  const CardGroup = styled.div`
    width: 100%;
    padding: 20px 0;
  `;
  

  
  
  
  