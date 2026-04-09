import React from 'react';
import styled from 'styled-components';

// --- Interfaces de Datos ---
interface FinancialData {
  totalInvoices: number;
  withCxC: number;
  withoutCxC: number;
  coveragePercent: number;
  totalAmount: string; // Ej: "RD$1,215,300.00"
  lastUpdate: string; // Ej: "19/11/2025 08:48"
}

interface Props {
  data: FinancialData;
  className?: string;
}

// --- Styled Components (Diseño Custom) ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const MetaHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  color: #8c8c8c;
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  /* En pantallas grandes 2 columnas, en móviles 1 */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const BaseCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }
`;

// Estilos específicos para textos
const Label = styled.span`
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const BigValue = styled.span`
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
`;

const Badge = styled.span`
  background-color: #ecfdf5;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 8px;
  vertical-align: middle;
`;

// --- Barra de Progreso Custom ---
const ProgressBarContainer = styled.div`
  height: 8px;
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 4px;
  margin: 1rem 0 0.5rem;
  overflow: hidden;
  display: flex;
`;

const ProgressSegment = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }: { $width: number }) => $width}%;
  background-color: ${({ $color }: { $color: string }) => $color};
`;

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
`;

const Dot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ $color }: { $color: string }) => $color};
  margin-right: 4px;
`;

// --- Componente Principal ---

export const FinancialSummary = ({ data, className }: Props) => {
  // Calculamos porcentajes para la barra visual
  const percentWithCxC = (data.withCxC / data.totalInvoices) * 100;
  const percentWithoutCxC = 100 - percentWithCxC;

  return (
    <Container className={className}>
      <MetaHeader>Última actualización: {data.lastUpdate}</MetaHeader>

      <Grid>
        {/* Tarjeta 1: Volumen y Salud de Cartera */}
        <BaseCard>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
              }}
            >
              <div>
                <Label>Total Facturas</Label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <BigValue>{data.totalInvoices}</BigValue>
                  <Badge>{data.coveragePercent}% Cobertura</Badge>
                </div>
              </div>
            </div>

            {/* Barra Visual */}
            <ProgressBarContainer>
              <ProgressSegment $width={percentWithCxC} $color="#3b82f6" />{' '}
              {/* Azul: Con Deuda */}
              <ProgressSegment
                $width={percentWithoutCxC}
                $color="#e5e7eb"
              />{' '}
              {/* Gris: Sin Deuda */}
            </ProgressBarContainer>

            <Legend>
              <span>
                <Dot $color="#3b82f6" /> {data.withCxC} Con CxC
              </span>
              <span>
                <Dot $color="#e5e7eb" /> {data.withoutCxC} Sin CxC
              </span>
            </Legend>
          </div>
        </BaseCard>

        {/* Tarjeta 2: Financiero */}
        <BaseCard style={{ justifyContent: 'center' }}>
          <div>
            <Label>Monto Agregado</Label>
            <div>
              <BigValue style={{ color: '#059669' }}>
                {data.totalAmount}
              </BigValue>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              Total acumulado de facturas listadas
            </div>
          </div>
        </BaseCard>
      </Grid>
    </Container>
  );
};

export default FinancialSummary;
