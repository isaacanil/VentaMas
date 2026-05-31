import { Alert, Button, Segmented } from 'antd';
import { useState } from 'react';
import {
  Field,
  FieldLabel,
  PlanLabel,
  PlanLabelCode,
  PlanLabelName,
  Stack,
} from './SimulatedPlanSelectionCard.styles';

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

const RESULT_OPTIONS: Array<{ label: string; value: SimulatedBillingResult }> =
  [
    { label: 'Exito', value: 'success' },
    { label: 'Cancelacion', value: 'canceled' },
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
  const canRun =
    canManagePayments && hasActiveBusiness && !busy && plans.length > 0;

  return (
    <Stack>
      {plans.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Catalogo no disponible"
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
          options={plans.map((plan) => ({
            label: (
              <PlanLabel>
                <PlanLabelName>
                  {plan.displayName.replace(`(${plan.planCode})`, '').trim()}
                </PlanLabelName>
                <PlanLabelCode>{plan.planCode}</PlanLabelCode>
              </PlanLabel>
            ),
            value: plan.planCode,
          }))}
          value={selectedPlanCode}
          onChange={(value) => onSelectPlan(value as string)}
          disabled={busy || plans.length === 0}
          block
        />
      </Field>

      <Field>
        <FieldLabel>Resultado</FieldLabel>
        <Segmented
          options={RESULT_OPTIONS}
          value={result}
          onChange={(value) => setResult(value as SimulatedBillingResult)}
          disabled={busy}
          block
        />
      </Field>

      <Button
        type="primary"
        loading={busy}
        disabled={!canRun}
        onClick={() => {
          void onSimulateResult(result);
        }}
        block
      >
        Simular
      </Button>
    </Stack>
  );
};

export default SimulatedPlanSelectionCard;
