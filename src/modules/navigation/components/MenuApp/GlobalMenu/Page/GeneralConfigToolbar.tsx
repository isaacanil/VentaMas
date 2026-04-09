import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

type ToolbarSectionKey =
  | 'billing'
  | 'subscription'
  | 'business'
  | 'tax-receipt'
  | 'app-info';

const GeneralConfigToolbar = ({ side = 'left' }: ToolbarComponentProps) => {
  const location = useLocation();
  const path = location.pathname;

  // Objeto de configuración que mapea rutas a contenidos de toolbar
  const toolbarConfig: Record<
    ToolbarSectionKey,
    { leftSide: () => React.ReactNode; rightSide: () => React.ReactNode }
  > = {
    // Billing (facturación)
    billing: {
      leftSide: () => null,
      rightSide: () => null,
    },
    // Subscription and payments
    subscription: {
      leftSide: () => null,
      rightSide: () => null,
    },
    // Business info (datos de la empresa)
    business: {
      leftSide: () => null,
      rightSide: () => null,
    },
    // Tax receipt (comprobantes fiscales)
    'tax-receipt': {
      leftSide: () => null,
      rightSide: () => null,
    },
    // App info
    'app-info': {
      leftSide: () => null,
      rightSide: () => null,
    },
  };

  // Determinar qué sección está activa
  const getActiveSection = (): ToolbarSectionKey => {
    if (path.includes('subscription')) return 'subscription';
    if (path.includes('business')) return 'business';
    if (path.includes('tax-receipt')) return 'tax-receipt';
    if (path.includes('app-info')) return 'app-info';
    return 'billing'; // Por defecto
  };

  const activeSection = getActiveSection();

  const activeConfig = toolbarConfig[activeSection];
  const content = activeConfig
    ? side === 'left'
      ? activeConfig.leftSide()
      : activeConfig.rightSide()
    : null;

  return <Container>{content}</Container>;
};

export default GeneralConfigToolbar;

const Container = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;
