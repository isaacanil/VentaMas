import { Alert, Button, Segmented } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

export type SimulatedBillingResult = 'success' | 'failed' | 'canceled';

export interface SimulatedPlanOption {
  planCode: string;
  displayName: string;
  priceMonthly: number;
  currency: string;
  description: string;
}

interface SimulatedPlanSelectionCardProps {
  plans: SimulatedPlanOption[];
  selectedPlanCode: string;
  onSelectPlan: (planCode: string) => void;
  onSimulateResult: (result: SimulatedBillingResult) => Promise<void>;
  busy: boolean;
  canManagePayments: boolean;
  hasActiveBusiness: boolean;
}

const RESULT_OPTIONS: Array<{ label: string; value: SimulatedBillingResult }> = [
  { label: 'Éxito', value: 'success' },
  { label: 'Cancelación', value: 'canceled' },
  { label: 'Fallo', value: 'failed' },
];

export const SimulatedPlanSelectionCard = ({
  plans,
  selectedPlanCode,
  onSelectPlan,
  onSimulateResult,
  busy,
  canManagePayments,
  hasActiveBusiness,
}: SimulatedPlanSelectionCardProps) => {
  const [result, setResult] = useState<SimulatedBillingResult>('success');
  const canRun = canManagePayments && hasActiveBusiness && !busy && plans.length > 0;

  return (
    <Stack>
      {plans.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Catálogo no disponible"
          description="No hay planes cargados desde Firestore para ejecutar simulaciones."
        />
      ) : null}

      {!canManagePayments ? (
        <Alert
          type="warning"
          showIcon
          message="Sin permisos para simular cobros"
          description="Necesitas rol owner/admin/dev para ejecutar este flujo."
        />
      ) : null}

      {!hasActiveBusiness ? (
        <Alert
          type="info"
          showIcon
          message="Sin negocio activo"
          description="Selecciona un negocio antes de simular el checkout."
        />
      ) : null}

      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Segmented
          options={plans.map((p) => ({
            label: (
              <PlanLabel>
                <PlanLabelName>{p.displayName.replace(`(${p.planCode})`, '').trim()}</PlanLabelName>
                <PlanLabelCode>{p.planCode}</PlanLabelCode>
              </PlanLabel>
            ),
            value: p.planCode,
          }))}
          value={selectedPlanCode}
          onChange={(v) => onSelectPlan(v as string)}
          disabled={busy || plans.length === 0}
          block
        />
      </Field>

      <Field>
        <FieldLabel>Resultado</FieldLabel>
        <Segmented
          options={RESULT_OPTIONS}
          value={result}
          onChange={(v) => setResult(v as SimulatedBillingResult)}
          disabled={busy}
          block
        />
      </Field>

      <Button
        type="primary"
        loading={busy}
        disabled={!canRun}
        onClick={() => { void onSimulateResult(result); }}
        block
      >
        Simular
      </Button>
    </Stack>
  );
};

export default SimulatedPlanSelectionCard;

const Stack = styled.div`
  display: grid;
  gap: 16px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

const FieldLabel = styled.span`
  color: #64748b;
  font-size: 0.83rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const PlanLabel = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 2px 0;
`;

const PlanLabelName = styled.span`
  font-weight: 600;
  font-size: 0.88rem;
  color: inherit;
`;

const PlanLabelCode = styled.span`
  font-size: 0.72rem;
  font-family: monospace;
  color: #94a3b8;
  font-weight: 400;
`;


