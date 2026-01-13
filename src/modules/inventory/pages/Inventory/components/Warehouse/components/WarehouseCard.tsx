import styled from 'styled-components';

import type { Warehouse } from '@/models/Warehouse/Warehouse';

// Estilos usando styled-components
const Card = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  overflow: hidden;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 1em;
  align-items: start;
  height: 4em;
  padding: 0.6em 1em;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
`;

const ShortName = styled.span`
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  background-color: #333;
  border-radius: 4px;
`;

const Section = styled.div`
  padding: 0 1em;
`;

type WarehouseCardData = Partial<Warehouse> & { id?: string };

interface WarehouseCardProps {
  warehouse: WarehouseCardData;
  onSelect: (warehouse: WarehouseCardData) => void;
}

// Definición del componente WarehouseCard
const WarehouseCard = ({ warehouse, onSelect }: WarehouseCardProps) => {
  return (
    <Card onClick={() => onSelect(warehouse)}>
      {/* Header Section */}
      <Header>
        <Title>{warehouse.name || ''}</Title>
        <ShortName>{warehouse.shortName || ''}</ShortName>
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
        <p>
          <strong>Number: </strong>
          {warehouse.number ?? ''}
        </p>
        <p>
          <strong>Owner: </strong> {warehouse.owner || ''}
        </p>
        <p>
          <strong>Location: </strong> {warehouse.location || ''}
        </p>
      </Section>
    </Card>
  );
};

export default WarehouseCard;
