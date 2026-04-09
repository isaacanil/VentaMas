import { WarningOutlined } from '@/constants/icons/antd';
import React from 'react';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import {
  ConfigButton,
  Container,
  CreditNoteConfigWarning,
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateSubDescription,
  EmptyStateTitle,
} from './styles';

export const CreditNoteConfigWarningState = ({
  title,
  subDescription,
  description,
  onConfigure,
}: {
  title: string;
  subDescription: string;
  description: string;
  onConfigure: () => void;
}) => (
  <>
    <MenuApp sectionName="Notas de Credito" data={[]} />
    <Container>
      <CreditNoteConfigWarning>
        <EmptyStateContainer>
          <EmptyStateIcon>
            <WarningOutlined />
          </EmptyStateIcon>
          <EmptyStateTitle>{title}</EmptyStateTitle>
          <EmptyStateSubDescription>{subDescription}</EmptyStateSubDescription>
          <EmptyStateDescription>{description}</EmptyStateDescription>
          <ConfigButton onClick={onConfigure}>Configurar ahora</ConfigButton>
        </EmptyStateContainer>
      </CreditNoteConfigWarning>
    </Container>
  </>
);
