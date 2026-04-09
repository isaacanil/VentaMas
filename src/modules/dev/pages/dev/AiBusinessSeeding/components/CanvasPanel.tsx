import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { ActionDefinition, BusinessSeedData } from '../types';

import BusinessInfoCard from './BusinessInfoCard';

const { Title } = Typography;

const CanvasColumn = styled.aside`
  width: 420px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem;
  gap: 1.5rem;
  box-shadow: -4px 0 12px rgb(0 0 0 / 2%);
  z-index: 5;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

const CanvasHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
`;

interface CanvasPanelProps {
  activeAction: string;
  actions: Record<string, ActionDefinition>;
  isTestMode: boolean;
  executionSuccess: boolean;
  actionData: unknown;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({
  activeAction,
  actions,
  isTestMode,
  executionSuccess,
  actionData,
}) => (
  <CanvasColumn>
    <CanvasHeader>
      <Title level={5} style={{ margin: 0 }}>
        <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: 8 }} />
        {actions[activeAction]?.name || 'Datos'}
      </Title>
      {isTestMode && (
        <Tag style={{ background: '#fff7e6', color: '#fa8c16' }}>
          TEST MODE
        </Tag>
      )}
      {executionSuccess && (
        <Tag style={{ background: '#f6ffed', color: '#52c41a' }}>CREADO</Tag>
      )}
    </CanvasHeader>

    {activeAction === 'createBusiness' && (
      <BusinessInfoCard
        data={actionData as BusinessSeedData}
        success={executionSuccess}
      />
    )}
  </CanvasColumn>
);

export default CanvasPanel;
