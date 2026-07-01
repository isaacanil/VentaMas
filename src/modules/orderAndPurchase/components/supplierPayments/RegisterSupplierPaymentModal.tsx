import { Alert, Button, Input, Typography, message } from 'antd';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { useId, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import { ModalShell } from '@/components/common/Modal';
import { selectUser } from '@/features/auth/userSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { fbAddAccountsPayablePayment } from '@/firebase/purchase/fbAddAccountsPayablePayment';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useAccountingBankingSettings } from '@/hooks/useAccountingBankPaymentPolicy';
import type { CashRegisterOption } from '@/modules/cashReconciliation/public';
import { useActiveBankAccounts } from '@/modules/accounting/public';
import type { UserIdentity } from '@/types/users';
import { hasTreasuryOperatorAccess } from '@/utils/access/treasuryOperatorAccess';
import { formatPrice } from '@/utils/format/formatPrice';
import type { Purchase } from '@/utils/purchase/types';
import { resolveConfiguredBankAccountId } from '@/utils/payments/bankPaymentPolicy';
import { PurchasePill } from '../../pages/OrderAndPurchase/shared/components/PurchasePill/PurchasePill';
import { SupplierPaymentGateState } from './components/SupplierPaymentGateState/SupplierPaymentGateState';
import { SupplierPaymentMethods } from './components/SupplierPaymentMethods/SupplierPaymentMethods';
import { useSupplierCreditNotes } from './hooks/useSupplierCreditNotes';
import {
  createDefaultSupplierPaymentMethods,
  getAvailableSupplierCreditBalance,
  getSupplierPaymentMethodsTotal,
  getSupplierPaymentSubmissionMethods,
  normalizeSupplierCreditNotes,
  resolveSupplierPaymentFiscalSettlement,
  roundToTwoDecimals,
  toFiniteNumber,
  validateSupplierPaymentMethods,
} from './utils/supplierPaymentMethods';
import { resolveSupplierPaymentCallableErrorMessage } from './utils/supplierPaymentErrors';

const { Text } = Typography;
const { TextArea } = Input;

const MIN_PAYMENT_EVIDENCE_LENGTH = 3;

const normalizeSupplierPaymentEvidence = (value: string): string =>
  value.trim();

const getSupplierPaymentEvidenceError = (value: string): string | null =>
  normalizeSupplierPaymentEvidence(value).length < MIN_PAYMENT_EVIDENCE_LENGTH
    ? 'Indica una evidencia o referencia.'
    : null;

type SupplierPaymentCashGateStatus = 'loading' | 'open' | 'closing' | 'closed';

const resolvePurchaseBalance = (purchase: Purchase | null): number => {
  if (!purchase) return 0;
  return roundToTwoDecimals(
    toFiniteNumber(purchase.paymentState?.balance) ??
      toFiniteNumber(purchase.paymentState?.total) ??
      toFiniteNumber((purchase as any).totalAmount) ??
      toFiniteNumber((purchase as any).total) ??
      0,
  );
};

const resolvePurchaseSupplierId = (
  purchase: Purchase | null,
): string | null => {
  if (!purchase) return null;
  if (typeof purchase.providerId === 'string' && purchase.providerId.trim()) {
    return purchase.providerId.trim();
  }
  if (typeof purchase.provider === 'string') {
    return purchase.provider.trim() || null;
  }
  if (purchase.provider && typeof purchase.provider === 'object') {
    const provider = purchase.provider as {
      id?: string | null;
      providerId?: string | null;
    };
    return provider.id?.trim() || provider.providerId?.trim() || null;
  }

  return null;
};

const normalizeSupplierPaymentCashGateStatus = (
  value: unknown,
): SupplierPaymentCashGateStatus => {
  if (value === 'loading') return 'loading';
  if (value === 'open') return 'open';
  if (value === 'closing') return 'closing';
  return 'closed';
};

const resolveSupplierPaymentCashGateCopy = (
  status: SupplierPaymentCashGateStatus,
) => {
  switch (status) {
    case 'loading':
      return {
        title: 'Comprobando tu cuadre de caja',
        description:
          'Espera un momento mientras validamos si puedes registrar este pago en efectivo.',
      };
    case 'closing':
      return {
        title: 'Tu cuadre está en proceso de cierre',
        description:
          'Cuando termine el cierre o vuelvas a tener un cuadre abierto, el formulario de pago estará disponible.',
      };
    default:
      return {
        title: 'No tienes un cuadre abierto',
        description:
          'Abre tu cuadre de caja para registrar este pago al proveedor.',
      };
  }
};

interface RegisterSupplierPaymentModalProps {
  open: boolean;
  purchase: Purchase | null;
  paymentRunId?: string | null;
  vendorBillId?: string | null;
  onCancel: () => void;
  onPaymentRegistered?: (purchase: Purchase) => void;
}

export const RegisterSupplierPaymentModal = ({
  open,
  purchase,
  paymentRunId = null,
  vendorBillId = null,
  onCancel,
  onPaymentRegistered,
}: RegisterSupplierPaymentModalProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const { status: rawCashRegisterStatus, cashCount: currentUserCashCount } =
    useIsOpenCashReconciliation() as {
      status: string;
      cashCount: {
        id?: string | null;
        incrementNumber?: string | number;
      } | null;
    };
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessId);
  const cashRegisterStatus = normalizeSupplierPaymentCashGateStatus(
    rawCashRegisterStatus,
  );
  const currentUserOpenCashRegisters = useMemo<CashRegisterOption[]>(
    () =>
      cashRegisterStatus === 'open' && currentUserCashCount?.id
        ? [
            {
              label: `Cuadre #${currentUserCashCount.incrementNumber || 'N/A'}`,
              value: currentUserCashCount.id,
            },
          ]
        : [],
    [cashRegisterStatus, currentUserCashCount],
  );
  const defaultCashRegisterId = currentUserOpenCashRegisters[0]?.value ?? null;
  const resolvedCashRegisterStatus: SupplierPaymentCashGateStatus =
    cashRegisterStatus === 'open' && defaultCashRegisterId == null
      ? 'loading'
      : cashRegisterStatus;
  const shouldLoadPaymentConfiguration = Boolean(
    open && isAccountingRolloutEnabled,
  );
  const { bankAccountsEnabled, bankPaymentPolicy } =
    useAccountingBankingSettings(businessId, shouldLoadPaymentConfiguration);
  const isBankAccountsModuleEnabled =
    shouldLoadPaymentConfiguration && bankAccountsEnabled;
  const bankAccounts = useActiveBankAccounts(
    businessId,
    isBankAccountsModuleEnabled,
  );
  const activeBankAccountIds = useMemo(
    () => new Set(bankAccounts.map((bankAccount) => bankAccount.value)),
    [bankAccounts],
  );
  const configuredBankAccountId = isBankAccountsModuleEnabled
    ? resolveConfiguredBankAccountId({
        policy: bankPaymentPolicy,
        moduleKey: 'purchases',
        availableBankAccountIds: activeBankAccountIds,
      })
    : null;
  const configuredBankAccountLabel =
    configuredBankAccountId != null
      ? (bankAccounts.find(
          (bankAccount) => bankAccount.value === configuredBankAccountId,
        )?.label ?? 'Cuenta bancaria configurada')
      : bankAccounts.length > 1
        ? 'Configura una cuenta bancaria en Ajustes > Contabilidad'
        : 'Sin cuenta bancaria activa configurada';
  const balance = useMemo(() => resolvePurchaseBalance(purchase), [purchase]);
  const fiscalSettlement = useMemo(
    () =>
      resolveSupplierPaymentFiscalSettlement({
        balance,
        purchase,
      }),
    [balance, purchase],
  );
  const [paymentMethods, setPaymentMethods] = useState(() =>
    createDefaultSupplierPaymentMethods({
      initialCashValue: fiscalSettlement.cashRequirementAmount,
      defaultCashCountId: defaultCashRegisterId,
    }),
  );
  const [occurredAt, setOccurredAt] = useState<number>(() => Date.now());
  const [nextPaymentAt, setNextPaymentAt] = useState<number | null>(null);
  const [showOccurredAtPicker, setShowOccurredAtPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => nanoid());
  const evidenceInputId = useId();
  const evidenceErrorId = useId();
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const supplierId = useMemo(
    () => resolvePurchaseSupplierId(purchase),
    [purchase],
  );
  const canRegisterSupplierPayment = hasTreasuryOperatorAccess(user);
  const { creditNotes: supplierCreditNotes } = useSupplierCreditNotes(
    businessId,
    supplierId,
    shouldLoadPaymentConfiguration,
  );

  const normalizedSupplierCreditNotes = useMemo(
    () => normalizeSupplierCreditNotes(supplierCreditNotes),
    [supplierCreditNotes],
  );
  const availableSupplierCreditBalance = useMemo(
    () => getAvailableSupplierCreditBalance(normalizedSupplierCreditNotes),
    [normalizedSupplierCreditNotes],
  );
  const hasSupplierCreditBalance = availableSupplierCreditBalance > 0.01;
  const effectivePaymentMethods = useMemo(
    () =>
      paymentMethods.map((method) =>
        method.method === 'supplierCreditNote' && !hasSupplierCreditBalance
          ? {
              ...method,
              status: false,
              value: 0,
              reference: '',
              bankAccountId: null,
              cashCountId: null,
              supplierCreditNoteId: null,
            }
          : method.method === 'cash' &&
              method.status &&
              !method.cashCountId &&
              defaultCashRegisterId
            ? {
                ...method,
                cashCountId: defaultCashRegisterId,
              }
            : method,
      ),
    [defaultCashRegisterId, hasSupplierCreditBalance, paymentMethods],
  );
  const providerName = useMemo(() => {
    if (!purchase?.provider) return null;
    if (typeof purchase.provider === 'string') return purchase.provider;
    if (typeof purchase.provider === 'object') {
      const provider = purchase.provider as { name?: string | null };
      return provider.name?.trim() || null;
    }
    return null;
  }, [purchase?.provider]);
  const normalizedAmount = useMemo(
    () => getSupplierPaymentMethodsTotal(effectivePaymentMethods),
    [effectivePaymentMethods],
  );
  const withholdingApplications = fiscalSettlement.withholdingApplications;
  const withholdingAmount = fiscalSettlement.withholdingAmount;
  const submissionPaymentMethods = useMemo(
    () =>
      getSupplierPaymentSubmissionMethods(effectivePaymentMethods, {
        includeBankAccount: isBankAccountsModuleEnabled,
        availableCreditNotes: normalizedSupplierCreditNotes,
      }),
    [
      effectivePaymentMethods,
      isBankAccountsModuleEnabled,
      normalizedSupplierCreditNotes,
    ],
  );
  const remainingBalance = roundToTwoDecimals(
    Math.max(balance - normalizedAmount - withholdingAmount, 0),
  );
  const normalizedEvidenceNote = normalizeSupplierPaymentEvidence(evidenceNote);
  const evidenceError = evidenceTouched
    ? getSupplierPaymentEvidenceError(evidenceNote)
    : null;
  const requiresNextPaymentDate = remainingBalance > 0.01;
  const cashGateCopy = resolveSupplierPaymentCashGateCopy(
    resolvedCashRegisterStatus,
  );

  if (!isAccountingRolloutEnabled) {
    return null;
  }

  const handleSubmit = async () => {
    if (!purchase || !user) return;
    if (!canRegisterSupplierPayment) {
      message.error('No tienes permisos para registrar pagos de CxP.');
      return;
    }

    const paymentMethodsError = validateSupplierPaymentMethods(
      effectivePaymentMethods,
      {
        allowBankMethods: isBankAccountsModuleEnabled,
        requireBankAccount: isBankAccountsModuleEnabled,
        availableCreditNotes: normalizedSupplierCreditNotes,
        balance,
        settlementAdjustmentAmount: withholdingAmount,
      },
    );
    if (paymentMethodsError) {
      message.error(paymentMethodsError);
      return;
    }
    if (requiresNextPaymentDate && !nextPaymentAt) {
      message.error(
        'Debe indicar la próxima fecha de pago cuando el abono es parcial.',
      );
      return;
    }
    setEvidenceTouched(true);
    const paymentEvidenceError = getSupplierPaymentEvidenceError(evidenceNote);
    if (paymentEvidenceError) {
      message.error(paymentEvidenceError);
      return;
    }

    setSubmitting(true);
    try {
      await fbAddAccountsPayablePayment(user, {
        purchase,
        vendorBillId,
        paymentRunId,
        paymentMethods: submissionPaymentMethods,
        withholdingApplications,
        occurredAt,
        nextPaymentAt: requiresNextPaymentDate ? nextPaymentAt : null,
        idempotencyKey,
        note: normalizedEvidenceNote,
        evidenceNote: normalizedEvidenceNote,
      });
      message.success('Pago a proveedor registrado correctamente.');
      onPaymentRegistered?.(purchase);
      onCancel();
    } catch (error) {
      console.error('Failed to register supplier payment', error);
      message.error(
        resolveSupplierPaymentCallableErrorMessage(
          error,
          'No se pudo registrar el pago al proveedor.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };
  const modalFooter = [
    <Button key="back" onClick={onCancel} disabled={submitting}>
      Cancelar
    </Button>,
    <Button
      key="submit"
      type="primary"
      onClick={handleSubmit}
      loading={submitting}
      disabled={!isAccountingRolloutEnabled}
    >
      Registrar pago
    </Button>,
  ];

  if (!canRegisterSupplierPayment) {
    return (
      <ModalShell
        title="Registrar pago a proveedor"
        open={open}
        onCancel={onCancel}
        width={520}
        footer={[
          <Button key="close" onClick={onCancel}>
            Cerrar
          </Button>,
        ]}
        destroyOnHidden
      >
        <Alert
          message="No tienes permisos para registrar pagos de CxP"
          description="Esta acción requiere un rol de tesorería, contabilidad o administración."
          showIcon
          type="warning"
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Registrar pago a proveedor"
      open={open}
      onCancel={onCancel}
      width={520}
      footer={modalFooter}
      destroyOnHidden
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {resolvedCashRegisterStatus !== 'open' && (
          <SupplierPaymentGateState
            title={cashGateCopy.title}
            description={cashGateCopy.description}
            loading={resolvedCashRegisterStatus === 'loading'}
          />
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <PurchasePill label="Proveedor">
            {providerName ?? `Compra ${purchase?.numberId ?? ''}`}
          </PurchasePill>
          <PurchasePill
            label="Fecha de pago"
            interactive
            onClick={() => setShowOccurredAtPicker((value) => !value)}
            ariaLabel="Cambiar fecha de pago"
          >
            {DateTime.fromMillis(occurredAt).toFormat('dd/MM/yyyy')}
          </PurchasePill>
        </div>

        {showOccurredAtPicker && (
          <div>
            <Text strong>Seleccionar fecha de pago</Text>
            <div style={{ marginTop: 6 }}>
              <DatePicker
                format="DD/MM/YYYY"
                value={DateTime.fromMillis(occurredAt)}
                onChange={(date) =>
                  setOccurredAt(date ? date.toMillis() : Date.now())
                }
              />
            </div>
          </div>
        )}

        <SupplierPaymentMethods
          methods={effectivePaymentMethods}
          targetAmount={fiscalSettlement.cashRequirementAmount}
          balance={balance}
          totalToRegister={normalizedAmount}
          settlementAdjustmentAmount={withholdingAmount}
          bankAccountsEnabled={isBankAccountsModuleEnabled}
          bankAccounts={bankAccounts}
          defaultBankAccountId={configuredBankAccountId}
          defaultBankAccountLabel={configuredBankAccountLabel}
          cashRegisters={currentUserOpenCashRegisters}
          availableSupplierCreditNotes={normalizedSupplierCreditNotes}
          availableSupplierCreditBalance={availableSupplierCreditBalance}
          onChange={setPaymentMethods}
          disabled={submitting}
        />

        <EvidenceField>
          <label htmlFor={evidenceInputId}>Evidencia o referencia</label>
          <TextArea
            id={evidenceInputId}
            aria-errormessage={evidenceError ? evidenceErrorId : undefined}
            aria-invalid={evidenceError ? 'true' : 'false'}
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={submitting}
            maxLength={240}
            onBlur={() => setEvidenceTouched(true)}
            onChange={(event) => {
              const nextEvidence = event.target.value;
              setEvidenceNote(nextEvidence);
              if (
                evidenceTouched &&
                getSupplierPaymentEvidenceError(nextEvidence) == null
              ) {
                setEvidenceTouched(false);
              }
            }}
            placeholder="Ticket, comprobante, referencia bancaria o enlace del soporte"
            required
            showCount
            status={evidenceError ? 'error' : undefined}
            value={evidenceNote}
          />
          {evidenceError ? (
            <FieldError id={evidenceErrorId} role="alert">
              {evidenceError}
            </FieldError>
          ) : null}
        </EvidenceField>

        {withholdingAmount > 0.01 && (
          <Alert
            message="Retención fiscal aplicada a esta liquidación"
            description={`Se liquidarán ${formatPrice(withholdingAmount)} como retención fiscal sin generar salida de caja o banco. ITBIS ${formatPrice(fiscalSettlement.withholdingITBISAmount)} · ISR ${formatPrice(fiscalSettlement.withholdingISRAmount)}.`}
            showIcon
            type="info"
          />
        )}

        {requiresNextPaymentDate && (
          <div>
            <Text strong>Próxima fecha de pago</Text>
            <div style={{ marginTop: 6 }}>
              <DatePicker
                format="DD/MM/YYYY"
                value={
                  nextPaymentAt
                    ? DateTime.fromMillis(nextPaymentAt)
                    : DateTime.now()
                }
                onChange={(date) =>
                  setNextPaymentAt(date ? date.toMillis() : null)
                }
              />
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

const EvidenceField = styled.div`
  display: grid;
  gap: 8px;

  label {
    color: var(--ds-color-text-primary, #111);
    font-weight: 600;
  }
`;

const FieldError = styled.div`
  color: #cf1322;
  font-size: 12px;
`;
