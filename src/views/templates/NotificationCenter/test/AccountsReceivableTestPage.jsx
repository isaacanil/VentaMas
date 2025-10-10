import React from 'react';
import styled from 'styled-components';

import AccountsReceivablePanel from '../components/panels/AccountsReceivablePanel';

/**
 * Página de prueba para el panel de Cuentas por Cobrar
 * Úsala para verificar que el panel funciona correctamente
 */
const AccountsReceivableTestPage = () => {
  return (
    <TestContainer>
      <TestHeader>
        <h1>Panel de Cuentas por Cobrar - Prueba</h1>
        <p>Esta página te permite probar el nuevo panel de cuentas por cobrar próximas a vencer.</p>
      </TestHeader>
      
      <TestSection>
        <h2>Panel sin estadísticas rápidas (7 días)</h2>
        <PanelWrapper>
          <AccountsReceivablePanel 
            showQuickStats={false} 
            daysThreshold={7} 
          />
        </PanelWrapper>
      </TestSection>
      
      <TestSection>
        <h2>Panel con estadísticas rápidas (14 días)</h2>
        <PanelWrapper>
          <AccountsReceivablePanel 
            showQuickStats={true} 
            daysThreshold={14} 
          />
        </PanelWrapper>
      </TestSection>
      
      <TestSection>
        <h2>Panel con alertas de 30 días</h2>
        <PanelWrapper>
          <AccountsReceivablePanel 
            showQuickStats={true} 
            daysThreshold={30} 
          />
        </PanelWrapper>
      </TestSection>
    </TestContainer>
  );
};

const TestContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8fafc;
  min-height: 100vh;
`;

const TestHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    color: #1e293b;
    font-size: 2rem;
    margin-bottom: 8px;
  }
  
  p {
    color: #64748b;
    font-size: 1rem;
  }
`;

const TestSection = styled.div`
  margin-bottom: 40px;
  
  h2 {
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 16px;
  }
`;

const PanelWrapper = styled.div`
  max-width: 400px;
  margin: 0 auto;
`;

export default AccountsReceivableTestPage;
