import { useMemo, useState } from 'react';

import { Alert, Button, Card, Chip, Table } from '@heroui/react';
import styled from 'styled-components';

import { useErrorReports } from './useErrorReports';

const getStatusChip = (status: string) => {
  if (status === 'resolved') {
    return (
      <Chip color="success" size="sm" variant="soft">
        <Chip.Label>Resuelto</Chip.Label>
      </Chip>
    );
  }

  return (
    <Chip color="warning" size="sm" variant="soft">
      <Chip.Label>Pendiente</Chip.Label>
    </Chip>
  );
};

const ErrorReports = () => {
  const { error, loading, reload, rows, summary } = useErrorReports();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const activeRow = useMemo(
    () => rows.find((row) => row.id === selectedReportId) ?? rows[0] ?? null,
    [rows, selectedReportId],
  );

  return (
    <Page>
      <Header>
        <div>
          <Title>Errores reportados</Title>
          <Description>
            Últimos errores capturados por ErrorBoundary y enviados a Firestore.
          </Description>
        </div>
        <Button isPending={loading} variant="secondary" onPress={reload}>
          Recargar
        </Button>
      </Header>

      <SummaryGrid>
        <Card variant="secondary">
          <Card.Header>
            <Card.Description>Total</Card.Description>
            <Card.Title>{summary.total}</Card.Title>
          </Card.Header>
        </Card>
        <Card variant="secondary">
          <Card.Header>
            <Card.Description>Pendientes</Card.Description>
            <Card.Title>{summary.pending}</Card.Title>
          </Card.Header>
        </Card>
        <Card variant="secondary">
          <Card.Header>
            <Card.Description>Resueltos</Card.Description>
            <Card.Title>{summary.resolved}</Card.Title>
          </Card.Header>
        </Card>
      </SummaryGrid>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              No se pudieron cargar los errores reportados
            </Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {activeRow && (
        <Card>
          <Card.Header>
            <Card.Description>Detalle seleccionado</Card.Description>
            <Card.Title>{activeRow.businessLabel}</Card.Title>
          </Card.Header>
          <Card.Content>
            <DetailsGrid>
              <DetailBlock>
                <DetailLabel>Stack</DetailLabel>
                <CodeBlock>
                  {activeRow.errorStackTrace || 'Sin stack'}
                </CodeBlock>
              </DetailBlock>
              <DetailBlock>
                <DetailLabel>Component stack / info</DetailLabel>
                <CodeBlock>{activeRow.errorInfo || 'Sin info'}</CodeBlock>
              </DetailBlock>
            </DetailsGrid>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Content>
          <Table variant="primary" className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Errores reportados">
                <Table.Header>
                  <Table.Column isRowHeader>Hora</Table.Column>
                  <Table.Column>Negocio</Table.Column>
                  <Table.Column>Usuario</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  <Table.Column>Error</Table.Column>
                  <Table.Column>Acción</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rows.map((row) => (
                    <Table.Row key={row.id} id={row.id}>
                      <Table.Cell>{row.createdAtLabel}</Table.Cell>
                      <Table.Cell>
                        <IdentityStack>
                          <strong>{row.businessLabel}</strong>
                          {row.businessId && <small>{row.businessId}</small>}
                        </IdentityStack>
                      </Table.Cell>
                      <Table.Cell>
                        <IdentityStack>
                          <strong>{row.userLabel}</strong>
                          {row.userId && <small>{row.userId}</small>}
                        </IdentityStack>
                      </Table.Cell>
                      <Table.Cell>{getStatusChip(row.status)}</Table.Cell>
                      <Table.Cell>
                        <ErrorSummary>
                          {row.errorStackTrace ||
                            row.errorInfo ||
                            'Sin detalle registrado'}
                        </ErrorSummary>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="sm"
                          variant={
                            activeRow?.id === row.id ? 'primary' : 'tertiary'
                          }
                          onPress={() => setSelectedReportId(row.id)}
                        >
                          Ver
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          {!loading && rows.length === 0 && (
            <EmptyState>No hay errores reportados.</EmptyState>
          )}
        </Card.Content>
      </Card>
    </Page>
  );
};

const Page = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  background: var(--ds-color-bg-page, #f8f9fa);
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary, #18181b);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
`;

const Description = styled.p`
  max-width: 720px;
  margin: 6px 0 0;
  color: var(--ds-color-text-secondary, #71717a);
  font-size: 14px;
  line-height: 1.5;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const IdentityStack = styled.div`
  display: grid;
  gap: 2px;

  small {
    color: var(--ds-color-text-secondary, #71717a);
    font-size: 11px;
    word-break: break-all;
  }
`;

const ErrorSummary = styled.div`
  display: -webkit-box;
  max-width: 520px;
  overflow: hidden;
  color: var(--ds-color-text-primary, #18181b);
  font-family: var(
    --ds-font-family-mono,
    ui-monospace,
    SFMono-Regular,
    Consolas,
    'Liberation Mono',
    monospace
  );
  font-size: 12px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`;

const EmptyState = styled.div`
  padding: 28px 0;
  color: var(--ds-color-text-secondary, #71717a);
  text-align: center;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const DetailBlock = styled.div`
  display: grid;
  gap: 8px;
`;

const DetailLabel = styled.strong`
  color: var(--ds-color-text-primary, #18181b);
  font-size: 13px;
`;

const CodeBlock = styled.pre`
  max-height: 280px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  border: 1px solid var(--ds-color-border-subtle, #e4e4e7);
  border-radius: 6px;
  background: var(--ds-color-bg-page, #f4f4f5);
  color: var(--ds-color-text-primary, #18181b);
  font-family: var(
    --ds-font-family-mono,
    ui-monospace,
    SFMono-Regular,
    Consolas,
    'Liberation Mono',
    monospace
  );
  font-size: 12px;
  white-space: pre-wrap;
`;

export default ErrorReports;
