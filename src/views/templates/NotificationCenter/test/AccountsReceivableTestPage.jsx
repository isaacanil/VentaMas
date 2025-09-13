import React from 'react';
import styled from 'styled-components';
import AccountsReceivableWidget from '../components/AccountsReceivableWidget';

/**
 * Página de prueba para el widget de Cuentas por Cobrar
 * Úsala para verificar que el widget funciona correctamente
 */
const AccountsReceivableTestPage = () => {
  return (
    <TestContainer>
      <TestHeader>
        <h1>Widget de Cuentas por Cobrar - Prueba</h1>
        <p>Esta página te permite probar el nuevo widget de cuentas por cobrar próximas a vencer.</p>
      </TestHeader>
      
      <TestSection>
        <h2>Widget sin estadísticas rápidas (7 días)</h2>
        <WidgetWrapper>
          <AccountsReceivableWidget 
            showQuickStats={false} 
            daysThreshold={7} 
          />
        </WidgetWrapper>
      </TestSection>
      
      <TestSection>
        <h2>Widget con estadísticas rápidas (14 días)</h2>
        <WidgetWrapper>
          <AccountsReceivableWidget 
            showQuickStats={true} 
            daysThreshold={14} 
          />
        </WidgetWrapper>
      </TestSection>
      
      <TestSection>
        <h2>Widget con alertas de 30 días</h2>
        <WidgetWrapper>
          <AccountsReceivableWidget 
            showQuickStats={true} 
            daysThreshold={30} 
          />
        </WidgetWrapper>
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

const WidgetWrapper = styled.div`
  max-width: 400px;
  margin: 0 auto;
`;

export default AccountsReceivableTestPage;
