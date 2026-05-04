import styled from 'styled-components';

interface GeneralLedgerEmptyStateProps {
  loading: boolean;
}

export const GeneralLedgerEmptyState = ({
  loading,
}: GeneralLedgerEmptyStateProps) => (
  <Panel>
    <SectionTitle>Libro mayor</SectionTitle>
    <SectionText>
      {loading
        ? 'Cargando cuentas contables del libro mayor...'
        : 'No hay cuentas posteables activas para generar el mayor.'}
    </SectionText>
  </Panel>
);

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.5rem, 1.7vw, 1.8rem);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const SectionText = styled.p`
  margin: 6px 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
`;
