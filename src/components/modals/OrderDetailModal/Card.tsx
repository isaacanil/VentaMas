import React from 'react';
import styled from 'styled-components';

interface InfoCardCondition {
  id?: string | number;
  name?: string;
}

interface InfoCardState {
  id?: string | number;
  name?: string;
}

interface InfoCardProps {
  title: string;
  provider?: string;
  condition: InfoCardCondition;
  state: InfoCardState;
  updatedAt?: string | number | Date;
  color?: string;
}

export const InfoCard = ({
  title,
  provider,
  condition,
  state,
  updatedAt,
  color,
}: InfoCardProps) => {
  const formatUpdatedAt = (value?: string | number | Date) => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

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
        <Info>Última actualización: {formatUpdatedAt(updatedAt)}</Info>
        {/* ... y así con el resto */}
      </div>
    </CardWrapper>
  );
};
const CardWrapper = styled.div<{ color?: string }>`
  padding: 20px;
  margin-bottom: 20px;
  background-color: ${(props) => props.color};
  border: 2px solid ${(props) => props.color};
  border-radius: 10px;
`;

const Title = styled.h2`
  margin-bottom: 10px;
  font-size: 1.2rem;
`;

const Info = styled.p`
  margin-bottom: 5px;
  font-size: 1rem;
`;


