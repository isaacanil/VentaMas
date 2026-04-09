import {
  faCalendar,
  faBox,
  faDollarSign,
  faUserCircle,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, Tag } from 'antd';
import React from 'react';
import styled from 'styled-components';

type PreventaCardData = {
  id: string | number;
  estado: string;
  cliente: string;
  fecha: string;
  articulos: string[];
  total: number;
};

type PreventaCardProps = {
  preventa: PreventaCardData;
  onCancel: (id: PreventaCardData['id']) => void;
  onComplete: (id: PreventaCardData['id']) => void;
};

const StyledCard = styled(Card)`
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 10px 15px rgb(0 0 0 / 10%);
  }
`;

const StyledTag = styled(Tag)<{ status?: string }>`
  ${({ status }) => {
    switch (status) {
      case 'Pendiente':
        return 'background-color: #F59E0B; color: white;';
      case 'Completada':
        return 'background-color: #10B981; color: white;';
      case 'Cancelada':
        return 'background-color: #EF4444; color: white;';
      default:
        return 'background-color: #6B7280; color: white;';
    }
  }}
`;

const IDText = styled.span`
  font-size: 0.75rem; /* text-xs */
  color: #9ca3af; /* text-muted-foreground */
`;

const TitleSection = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Title = styled.h2`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  white-space: nowrap;
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
  font-size: 0.875rem; /* text-sm */
`;

const ContentItem = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled(FontAwesomeIcon)`
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
`;

const Articles = styled.span`
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const Price = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.125rem; /* text-lg */
  font-weight: 700; /* font-bold */
  color: #1e3a8a; /* text-primary */
`;

const PreventaCard = ({
  preventa,
  onCancel,
  onComplete,
}: PreventaCardProps) => {
  return (
    <StyledCard
      hoverable
      actions={[
        <Button
          key="cancel" // Added key
          type="primary"
          danger
          onClick={() => onCancel(preventa.id)}
          icon={<FontAwesomeIcon icon={faTimes} />}
        >
          Cancelar
        </Button>,
        <Button
          key="complete" // Added key
          type="primary"
          onClick={() => onComplete(preventa.id)}
          icon={<FontAwesomeIcon icon={faCheck} />}
        >
          Completar
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <StyledTag status={preventa.estado}>{preventa.estado}</StyledTag>
            <IDText>ID: {preventa.id}</IDText>
          </div>
        }
        description={
          <>
            <TitleSection>
              <FontAwesomeIcon
                icon={faUserCircle}
                style={{ height: '1.25rem', width: '1.25rem' }}
              />
              <Title>{preventa.cliente}</Title>
            </TitleSection>
            <ContentSection>
              <ContentItem>
                <Icon icon={faCalendar} />
                <span>{preventa.fecha}</span>
              </ContentItem>
              <ContentItem>
                <FontAwesomeIcon
                  icon={faBox}
                  style={{
                    marginRight: '0.5rem',
                    height: '1rem',
                    width: '1rem',
                    marginTop: '0.25rem',
                  }}
                />
                <Articles>{preventa.articulos.join(', ')}</Articles>
              </ContentItem>
              <Price>
                <FontAwesomeIcon
                  icon={faDollarSign}
                  style={{
                    marginRight: '0.5rem',
                    height: '1.25rem',
                    width: '1.25rem',
                  }}
                />
                <span>{preventa.total.toFixed(2)}</span>
              </Price>
            </ContentSection>
          </>
        }
      />
    </StyledCard>
  );
};

export default PreventaCard;
