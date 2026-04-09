import { Alert, Button, InputNumber, Select, Switch } from 'antd';
import { useReducer } from 'react';
import styled from 'styled-components';

export type ScenarioStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'unpaid'
  | 'deprecated'
  | 'scheduled';

export type ScenarioScope = 'account' | 'business';

type PlanOption = {
  label: string;
  value: string;
};

export type MockScenarioPayload = {
  businessId: string;
  nextStatus: ScenarioStatus;
  planCode?: string;
  provider?: string;
  scope?: ScenarioScope;
  targetBusinessId?: string;
  note?: string;
  recordPayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paymentDescription?: string;
};

type MockSubscriptionFlowCardProps = {
  enabled: boolean;
  busy: boolean;
  businessId: string | null;
  canManagePayments: boolean;
  defaultPlanCode: string;
  defaultAmount: number;
  planOptions: PlanOption[];
  onRunScenario: (payload: MockScenarioPayload) => Promise<void>;
  onCloseMock?: () => void;
};

type MockSubscriptionFlowState = {
  nextStatus: ScenarioStatus;
  planCode: string;
  paymentAmount: number;
  recordPayment: boolean;
};

type MockSubscriptionFlowAction =
  | { type: 'setNextStatus'; value: ScenarioStatus }
  | { type: 'setPlanCode'; value: string }
  | { type: 'setPaymentAmount'; value: number }
  | { type: 'setRecordPayment'; value: boolean };

const STATUS_OPTIONS: Array<{ value: ScenarioStatus; label: string }> = [
  { value: 'none', label: 'Sin suscripción' },
  { value: 'trialing', label: 'Trial' },
  { value: 'active', label: 'Activa' },
  { value: 'past_due', label: 'Pago pendiente' },
  { value: 'unpaid', label: 'Sin pago' },
  { value: 'paused', label: 'Pausada' },
  { value: 'canceled', label: 'Cancelada' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'deprecated', label: 'Deprecada' },
];

const createInitialState = ({
  defaultAmount,
  defaultPlanCode,
}: Pick<MockSubscriptionFlowCardProps, 'defaultAmount' | 'defaultPlanCode'>): MockSubscriptionFlowState => ({
  nextStatus: 'active',
  planCode: defaultPlanCode || '',
  paymentAmount: defaultAmount || 0,
  recordPayment: true,
});

const reducer = (
  state: MockSubscriptionFlowState,
  action: MockSubscriptionFlowAction,
): MockSubscriptionFlowState => {
  switch (action.type) {
    case 'setNextStatus': return { ...state, nextStatus: action.value };
    case 'setPlanCode': return { ...state, planCode: action.value };
    case 'setPaymentAmount': return { ...state, paymentAmount: action.value };
    case 'setRecordPayment': return { ...state, recordPayment: action.value };
    default: return state;
  }
};

export const MockSubscriptionFlowCard = ({
  enabled,
  busy,
  businessId,
  canManagePayments,
  defaultPlanCode,
  defaultAmount,
  planOptions,
  onRunScenario,
}: MockSubscriptionFlowCardProps) => {
  const [state, dispatchState] = useReducer(
    reducer,
    { defaultAmount, defaultPlanCode },
    createInitialState,
  );
  const { nextStatus, planCode, paymentAmount, recordPayment } = state;

  const safePlanCode = (() => {
    if (!planOptions.length) return '';
    if (planOptions.some((o) => o.value === planCode)) return planCode;
    if (defaultPlanCode && planOptions.some((o) => o.value === defaultPlanCode)) return defaultPlanCode;
    return planOptions[0]?.value || '';
  })();

  if (!enabled) return null;

  const disabled = busy || !businessId || !canManagePayments || !planOptions.length;

  return (
    <Stack>
      {!canManagePayments ? (
        <Alert
          type="warning"
          showIcon
          message="Sin permisos de pago"
          description="Necesitas rol owner/admin/dev para ejecutar escenarios mock."
        />
      ) : null}

      {!planOptions.length ? (
        <Alert
          type="warning"
          showIcon
          message="Catálogo no disponible"
          description="No hay planes cargados desde Firestore para ejecutar escenarios mock."
        />
      ) : null}

      <Field>
        <FieldLabel>Estado</FieldLabel>
        <Select
          value={nextStatus}
          options={STATUS_OPTIONS}
          onChange={(v) => dispatchState({ type: 'setNextStatus', value: v as ScenarioStatus })}
          style={{ width: '100%' }}
        />
      </Field>

      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Select
          value={safePlanCode}
          options={planOptions}
          onChange={(v) => dispatchState({ type: 'setPlanCode', value: v })}
          style={{ width: '100%' }}
        />
      </Field>

      <PaymentRow>
        <SwitchLabel>
          <Switch
            size="small"
            checked={recordPayment}
            onChange={(v) => dispatchState({ type: 'setRecordPayment', value: v })}
          />
          <span>Registrar pago</span>
        </SwitchLabel>
        {recordPayment ? (
          <InputNumber
            min={0}
            value={paymentAmount}
            onChange={(v) => dispatchState({ type: 'setPaymentAmount', value: Number(v || 0) })}
            style={{ width: 140 }}
            prefix="RD$"
          />
        ) : null}
      </PaymentRow>

      <Button
        type="primary"
        loading={busy}
        disabled={disabled}
        block
        onClick={() => {
          if (!businessId) return;
          void onRunScenario({
            businessId,
            nextStatus,
            planCode: safePlanCode,
            provider: 'mock',
            scope: 'business',
            targetBusinessId: businessId,
            note: `mock_ui:${nextStatus}`,
            recordPayment,
            paymentAmount: recordPayment ? paymentAmount : 0,
            paymentCurrency: 'DOP',
            paymentStatus: 'paid',
            paymentDescription: `Mock ${nextStatus}`,
          });
        }}
      >
        Ejecutar escenario
      </Button>
    </Stack>
  );
};

export default MockSubscriptionFlowCard;

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

const PaymentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #334155;
  font-size: 0.9rem;
`;
