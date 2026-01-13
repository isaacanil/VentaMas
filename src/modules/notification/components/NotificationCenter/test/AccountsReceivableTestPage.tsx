import React from 'react';
import styled from 'styled-components';

import AccountsReceivablePanel from '../components/panels/AccountsReceivablePanel/AccountsReceivablePanel';

/**
 * Página de prueba para el panel de Cuentas por Cobrar
 * Úsala para verificar que el panel funciona correctamente
 */
const AccountsReceivableTestPage = () => {
  return (
    <TestContainer>
      <TestHeader>
        <h1>Panel de Cuentas por Cobrar - Prueba</h1>
        <p>
          Esta página te permite probar el nuevo panel de cuentas por cobrar
          próximas a vencer.
        </p>
      </TestHeader>

      <TestSection>
        <h2>Panel sin estadísticas rápidas (7 días)</h2>
        <PanelWrapper>
          <AccountsReceivablePanel showQuickStats={false} daysThreshold={7} />
        </PanelWrapper>
      </TestSection>

      <TestSection>
        <h2>Panel con estadísticas rápidas (14 días)</h2>
        <PanelWrapper>
          <AccountsReceivablePanel showQuickStats={true} daysThreshold={14} />
        </PanelWrapper>
      </TestSection>

      <TestSection>
        <h2>Panel con alertas de 30 días</h2>
        <PanelWrapper>
          <AccountsReceivablePanel showQuickStats={true} daysThreshold={30} />
        </PanelWrapper>
      </TestSection>
    </TestContainer>
  );
};

const TestContainer = styled.div`
  max-width: 1200px;
  min-height: 100vh;
  padding: 20px;
  margin: 0 auto;
  background: #f8fafc;
`;

const TestHeader = styled.div`
  margin-bottom: 40px;
  text-align: center;

  h1 {
    margin-bottom: 8px;
    font-size: 2rem;
    color: #1e293b;
  }

  p {
    font-size: 1rem;
    color: #64748b;
  }
`;

const TestSection = styled.div`
  margin-bottom: 40px;

  h2 {
    margin-bottom: 16px;
    font-size: 1.25rem;
    color: #1e293b;
  }
`;

const PanelWrapper = styled.div`
  max-width: 400px;
  margin: 0 auto;
`;

export default AccountsReceivableTestPage;
