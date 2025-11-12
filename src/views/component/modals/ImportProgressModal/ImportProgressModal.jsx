import { Modal, Progress, Card, Statistic } from 'antd';
import React from 'react';
import styled from 'styled-components';

const ImportProgressModal = ({ visible, progress }) => {
  const {
    totalProducts,
    processedProducts,
    updatedProducts,
    newProducts,
    newCategories,
    newIngredients,
    updatedIngredients,
  } = progress;

  const percentage = totalProducts > 0 
    ? Math.round((processedProducts / totalProducts) * 100) 
    : 0;

  return (
    <Modal
      title="Progreso de Importación"
      open={visible}
      footer={null}
      closable={false}
      width={600}
    >
      <ProgressContainer>
        <Progress 
          percent={percentage} 
          status={percentage === 100 ? "success" : "active"}
          size={15}
        />
        <StatsContainer>
          <StyledCard>
            <Statistic
              title="Productos Procesados"
              value={processedProducts}
              suffix={`/ ${totalProducts}`}
            />
          </StyledCard>
          <StatsGrid>
            <StyledCard>
              <Statistic title="Productos Actualizados" value={updatedProducts} />
            </StyledCard>
            <StyledCard>
              <Statistic title="Productos Nuevos" value={newProducts} />
            </StyledCard>
            <StyledCard>
              <Statistic title="Categorías Nuevas" value={newCategories} />
            </StyledCard>
            <StyledCard>
              <Statistic title="Ingredientes Nuevos" value={newIngredients} />
            </StyledCard>
            <StyledCard>
              <Statistic title="Ingredientes Actualizados" value={updatedIngredients} />
            </StyledCard>
          </StatsGrid>
        </StatsContainer>
      </ProgressContainer>
    </Modal>
  );
};

const ProgressContainer = styled.div`
  padding: 20px 0;
`;

const StatsContainer = styled.div`
  margin-top: 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const StyledCard = styled(Card)`
  text-align: center;
  &.ant-card {
    background: #f8f9fa;
    border-radius: 8px;
  }
`;

export default ImportProgressModal;
