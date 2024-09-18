import React from 'react';
import styled from 'styled-components';

// Estilos usando styled-components
const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  cursor: pointer;
`;

const Header = styled.div`
  padding: 0.6em 1em;
  display: grid;
  align-items: start;
  height: 4em;
  gap: 1em;
  grid-template-columns: 1fr min-content;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
`;

const ShortName = styled.span`
  display: inline-block;
  background-color: #333;
  color: #fff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
`;

const Section = styled.div`
  padding: 0em 1em;
`;

const ProgressContainer = styled.div`
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressBar = styled.div`
  width: ${({ utilization }) => utilization}%;
  background-color: #333;
  height: 100%;
`;

const InfoText = styled.p`
  font-size: 12px;
  color: #999;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px;
`;

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ color }) => color || 'inherit'};
`;

// Definición del componente WarehouseCard
const WarehouseCard = ({ warehouse, onSelect }) => {
  return (
    <Card onClick={() => onSelect(warehouse)}>
      {/* Header Section */}
      <Header>
        <Title>{warehouse.name}</Title>
        <ShortName>{warehouse.shortName}</ShortName>
      </Header>

      {/* Utilization Section */}
      {/* <Section>
        <ProgressContainer>
          <ProgressBar utilization={warehouse.utilization} />
        </ProgressContainer>
        <InfoText>{warehouse.utilization}%</InfoText>
      </Section> */}

      {/* Information Section */}
      <Section>
        <p><strong>Number: </strong>{warehouse.number}</p>
        <p><strong>Owner: </strong> {warehouse.owner}</p>
        <p><strong>Location: </strong> {warehouse.location}</p>
      </Section>
    </Card>
  );
};

export default WarehouseCard;
