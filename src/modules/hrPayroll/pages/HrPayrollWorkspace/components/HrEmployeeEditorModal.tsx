import type { FormEvent, Key, ReactNode } from 'react';
import { useState } from 'react';

import {
  VmAlert,
  VmButton,
  VmForm,
  VmInput,
  VmListBox,
  VmModal,
  VmNumberField,
  VmSelect,
  VmTextArea,
} from '@/components/heroui';
import { VmPhoneField } from '@/components/phone';
import {
  HR_EMPLOYEE_DOCUMENT_TYPE_LABELS as DOCUMENT_TYPE_LABELS,
  HR_EMPLOYEE_GENDER_LABELS as GENDER_LABELS,
  HR_EMPLOYEE_PAY_TYPE_LABELS as PAY_TYPE_LABELS,
  HR_EMPLOYEE_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import {
  getPhoneValidationMessage,
  normalizePhoneToE164,
} from '@/shared/phone';
import type { HrEmployeeInput, HrEmployeeRecord } from '@/types/hrPayroll';
import { normalizeServiceCommissionServiceRules } from '@/utils/commissions/serviceCommissions';
import {
  HR_DEPOSIT_ACCOUNT_TYPE_LABELS,
  getHrDepositAccountValidationMessage,
  normalizeHrDepositAccount,
} from '@/utils/hrPayroll/depositAccounts';
import { normalizeSalaryDeductionLines } from '@/utils/hrPayroll/salaryDeductions';

import {
  DOCUMENT_PLACEHOLDERS,
  UNSPECIFIED_GENDER_KEY,
  applyLinkedUserDefaults,
  getOptionLabel,
  toFiniteNumber,
} from './HrEmployeeEditorModal.helpers';
import {
  Field,
  FieldGrid,
  FieldHint,
  FieldSectionBody,
  FieldSectionFieldset,
  FieldSectionHeading,
  FieldSectionIndicator,
  FieldSectionLegend,
  FieldSectionPanel,
  FieldLabel,
  FieldSection,
  FieldSectionTitle,
  FieldSectionTrigger,
  FormSections,
  FullWidthField,
  ModalActions,
} from './HrEmployeeEditorModal.styles';
import type {
  HrEmployeeFormValues,
  HrLinkedUserOption,
} from './HrEmployeeEditorModal.types';
import { SalaryDeductionsSection } from './SalaryDeductionsSection/SalaryDeductionsSection';

export type {
  HrEmployeeFormValues,
  HrLinkedUserOption,
} from './HrEmployeeEditorModal.types';

interface HrEmployeeEditorModalProps {
  employee: HrEmployeeRecord | null;
  initialValues: HrEmployeeFormValues;
  onCancel: () => void;
  onSave: (values: HrEmployeeFormValues) => void | Promise<void>;
  open: boolean;
  saving: boolean;
  userOptions: HrLinkedUserOption[];
}

const ALL_EMPLOYEE_SECTION_KEYS = [
  'general',
  'payment',
  'deductions',
  'notes',
];

interface EmployeeFormSectionProps {
  children: ReactNode;
  id: string;
  title: string;
}

function EmployeeFormSection({
  children,
  id,
  title,
}: EmployeeFormSectionProps) {
  return (
    <FieldSection id={id}>
      <FieldSectionHeading level={3}>
        <FieldSectionTrigger type="button">
          <FieldSectionTitle>{title}</FieldSectionTitle>
          <FieldSectionIndicator />
        </FieldSectionTrigger>
      </FieldSectionHeading>
      <FieldSectionPanel>
        <FieldSectionBody>
          <FieldSectionFieldset>
            <FieldSectionLegend>{title}</FieldSectionLegend>
            {children}
          </FieldSectionFieldset>
        </FieldSectionBody>
      </FieldSectionPanel>
    </FieldSection>
  );
}

export function HrEmployeeEditorModal({
  employee,
  initialValues,
  onCancel,
  onSave,
  open,
  saving,
  userOptions,
}: HrEmployeeEditorModalProps) {
  const [draft, setDraft] = useState<HrEmployeeFormValues>(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const title = employee ? 'Editar colaborador' : 'Nuevo colaborador';
  const defaultExpandedKeys = employee
    ? ALL_EMPLOYEE_SECTION_KEYS
    : ['general'];

  const updateField = <K extends keyof HrEmployeeFormValues>(
    field: K,
    value: HrEmployeeFormValues[K],
  ) => {
    setValidationMessage(null);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleLinkedUserChange = (key: Key | null) => {
    const userId = key ? String(key) : null;
    const linkedUser =
      userOptions.find((option) => option.value === userId) ?? null;
    setValidationMessage(null);
    setDraft((current) => applyLinkedUserDefaults(current, linkedUser));
  };

  const updateDepositAccountField = <
    K extends keyof NonNullable<HrEmployeeInput['depositAccount']>,
  >(
    field: K,
    value: NonNullable<HrEmployeeInput['depositAccount']>[K],
  ) => {
    setValidationMessage(null);
    setDraft((current) => ({
      ...current,
      depositAccount: normalizeHrDepositAccount(
        field === 'accountType'
          ? {
              ...(current.depositAccount ?? {}),
              [field]: value,
            }
          : {
              accountType: current.depositAccount?.accountType ?? 'checking',
              ...(current.depositAccount ?? {}),
              [field]: value,
            },
      ),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = draft.code?.trim();
    const fullName = draft.fullName?.trim();
    if (!code || !fullName) {
      setValidationMessage('Código y nombre son requeridos.');
      return;
    }
    const normalizedPhone = normalizePhoneToE164(draft.phone);
    const phoneValidationMessage = getPhoneValidationMessage(draft.phone);
    if (phoneValidationMessage) {
      setValidationMessage(phoneValidationMessage);
      return;
    }
    const depositValidationMessage = getHrDepositAccountValidationMessage(
      draft.depositAccount,
    );
    if (depositValidationMessage) {
      setValidationMessage(depositValidationMessage);
      return;
    }
    const depositAccount = normalizeHrDepositAccount(draft.depositAccount);
    void onSave({
      ...draft,
      code,
      fullName,
      documentType: draft.documentType ?? 'cedula',
      documentId: draft.documentId?.trim() || null,
      gender: draft.gender ?? null,
      phone: normalizedPhone,
      baseSalaryAmount: toFiniteNumber(draft.baseSalaryAmount),
      hourlyRateAmount: toFiniteNumber(draft.hourlyRateAmount),
      paymentDestination: draft.paymentDestination?.trim() || null,
      depositAccount,
      salaryDeductions: normalizeSalaryDeductionLines(draft.salaryDeductions),
      defaultCommissionRate:
        draft.defaultCommissionRate == null
          ? null
          : toFiniteNumber(draft.defaultCommissionRate),
      serviceCommissionRules: normalizeServiceCommissionServiceRules(
        draft.serviceCommissionRules,
      ),
    });
  };

  return (
    <VmModal
      title={title}
      ariaLabel={title}
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
      size="lg"
      footer={
        <ModalActions>
          <VmButton variant="secondary" isDisabled={saving} onPress={onCancel}>
            Cancelar
          </VmButton>
          <VmButton
            type="submit"
            form="hr-employee-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </VmButton>
        </ModalActions>
      }
    >
      <VmForm id="hr-employee-form" onSubmit={handleSubmit}>
        {validationMessage ? (
          <VmAlert status="danger">
            <VmAlert.Content>{validationMessage}</VmAlert.Content>
          </VmAlert>
        ) : null}

        <FormSections
          allowsMultipleExpanded
          aria-label="Secciones del colaborador"
          defaultExpandedKeys={defaultExpandedKeys}
        >
          <EmployeeFormSection id="general" title="Datos generales">
            <FieldGrid>
              <Field>
                <FieldLabel>Código</FieldLabel>
                <VmInput
                  aria-label="Código"
                  value={draft.code ?? ''}
                  disabled={saving}
                  placeholder="EMP-001"
                  onChange={(event) => updateField('code', event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Estado</FieldLabel>
                <VmSelect
                  aria-label="Estado"
                  selectedKey={draft.status ?? 'active'}
                  isDisabled={saving}
                  onSelectionChange={(key) =>
                    updateField(
                      'status',
                      String(key) as HrEmployeeInput['status'],
                    )
                  }
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {getOptionLabel(STATUS_LABELS, draft.status)}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Estados">
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <VmListBox.Item
                          key={value}
                          id={value}
                          textValue={label}
                        >
                          {label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <VmInput
                  aria-label="Nombre"
                  value={draft.fullName ?? ''}
                  disabled={saving}
                  placeholder="Nombre del colaborador"
                  onChange={(event) =>
                    updateField('fullName', event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Genero</FieldLabel>
                <VmSelect
                  aria-label="Genero"
                  selectedKey={draft.gender ?? UNSPECIFIED_GENDER_KEY}
                  isDisabled={saving}
                  onSelectionChange={(key) => {
                    const nextGender =
                      key && String(key) !== UNSPECIFIED_GENDER_KEY
                        ? (String(key) as HrEmployeeInput['gender'])
                        : null;
                    updateField('gender', nextGender);
                  }}
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {draft.gender
                        ? getOptionLabel(GENDER_LABELS, draft.gender)
                        : 'Sin especificar'}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Generos">
                      <VmListBox.Item
                        id={UNSPECIFIED_GENDER_KEY}
                        textValue="Sin especificar"
                      >
                        Sin especificar
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                      {Object.entries(GENDER_LABELS).map(([value, label]) => (
                        <VmListBox.Item
                          key={value}
                          id={value}
                          textValue={label}
                        >
                          {label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>
              <Field>
                <FieldLabel>Tipo de documento</FieldLabel>
                <VmSelect
                  aria-label="Tipo de documento"
                  selectedKey={draft.documentType ?? 'cedula'}
                  isDisabled={saving}
                  onSelectionChange={(key) => {
                    const nextDocumentType = (
                      key ? String(key) : 'cedula'
                    ) as HrEmployeeInput['documentType'];
                    updateField('documentType', nextDocumentType);
                  }}
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {getOptionLabel(DOCUMENT_TYPE_LABELS, draft.documentType)}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Tipos de documento">
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(
                        ([value, label]) => (
                          <VmListBox.Item
                            key={value}
                            id={value}
                            textValue={label}
                          >
                            {label}
                            <VmListBox.ItemIndicator />
                          </VmListBox.Item>
                        ),
                      )}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field>
                <FieldLabel>Documento</FieldLabel>
                <VmInput
                  aria-label="Documento"
                  value={draft.documentId ?? ''}
                  disabled={saving}
                  placeholder={
                    DOCUMENT_PLACEHOLDERS[draft.documentType ?? 'cedula']
                  }
                  onChange={(event) =>
                    updateField('documentId', event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Correo</FieldLabel>
                <VmInput
                  aria-label="Correo"
                  type="email"
                  value={draft.email ?? ''}
                  disabled={saving}
                  placeholder="correo@empresa.com"
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Telefono</FieldLabel>
                <VmPhoneField
                  id="hr-employee-phone"
                  ariaLabel="Telefono"
                  value={draft.phone ?? ''}
                  disabled={saving}
                  onValueChange={(phone) => updateField('phone', phone)}
                />
              </Field>

              <FullWidthField>
                <FieldLabel>Usuario vinculado</FieldLabel>
                <VmSelect
                  aria-label="Usuario vinculado"
                  selectedKey={draft.linkedUserId ?? null}
                  isDisabled={saving}
                  onSelectionChange={handleLinkedUserChange}
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {userOptions.find(
                        (option) => option.value === draft.linkedUserId,
                      )?.label ?? 'Sin usuario'}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Usuarios del negocio">
                      <VmListBox.Item id="" textValue="Sin usuario">
                        Sin usuario
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                      {userOptions.map((option) => (
                        <VmListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
                <FieldHint>
                  Usa datos del usuario para completar campos vacios; puedes
                  editar el colaborador manualmente.
                </FieldHint>
              </FullWidthField>

              <FullWidthField>
                <FieldLabel>Direccion</FieldLabel>
                <VmInput
                  aria-label="Direccion"
                  value={draft.address ?? ''}
                  disabled={saving}
                  placeholder="Direccion"
                  onChange={(event) =>
                    updateField('address', event.target.value)
                  }
                />
              </FullWidthField>
            </FieldGrid>
          </EmployeeFormSection>

          <EmployeeFormSection id="payment" title="Datos de pago y cuentas">
            <FieldGrid>
              <Field>
                <FieldLabel>Tipo de pago</FieldLabel>
                <VmSelect
                  aria-label="Tipo de pago"
                  selectedKey={draft.payType ?? 'salary'}
                  isDisabled={saving}
                  onSelectionChange={(key) =>
                    updateField(
                      'payType',
                      String(key) as HrEmployeeInput['payType'],
                    )
                  }
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {getOptionLabel(PAY_TYPE_LABELS, draft.payType)}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Tipos de pago">
                      {Object.entries(PAY_TYPE_LABELS).map(([value, label]) => (
                        <VmListBox.Item
                          key={value}
                          id={value}
                          textValue={label}
                        >
                          {label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field>
                <FieldLabel>Metodo de pago</FieldLabel>
                <VmSelect
                  aria-label="Metodo de pago"
                  selectedKey={draft.paymentMethod ?? 'bank_transfer'}
                  isDisabled={saving}
                  onSelectionChange={(key) =>
                    updateField(
                      'paymentMethod',
                      String(key) as HrEmployeeInput['paymentMethod'],
                    )
                  }
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {getOptionLabel(
                        PAYMENT_METHOD_LABELS,
                        draft.paymentMethod,
                      )}
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Metodos de pago">
                      {Object.entries(PAYMENT_METHOD_LABELS)
                        .filter(
                          ([value]) => value !== 'transfer' && value !== 'card',
                        )
                        .map(([value, label]) => (
                          <VmListBox.Item
                            key={value}
                            id={value}
                            textValue={label}
                          >
                            {label}
                            <VmListBox.ItemIndicator />
                          </VmListBox.Item>
                        ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field>
                <FieldLabel>Salario base</FieldLabel>
                <VmNumberField
                  aria-label="Salario base"
                  minValue={0}
                  value={toFiniteNumber(draft.baseSalaryAmount)}
                  isDisabled={saving}
                  onChange={(value) => updateField('baseSalaryAmount', value)}
                >
                  <VmNumberField.Group>
                    <VmNumberField.Input />
                  </VmNumberField.Group>
                </VmNumberField>
              </Field>

              <Field>
                <FieldLabel>Tarifa por hora</FieldLabel>
                <VmNumberField
                  aria-label="Tarifa por hora"
                  minValue={0}
                  value={toFiniteNumber(draft.hourlyRateAmount)}
                  isDisabled={saving}
                  onChange={(value) => updateField('hourlyRateAmount', value)}
                >
                  <VmNumberField.Group>
                    <VmNumberField.Input />
                  </VmNumberField.Group>
                </VmNumberField>
              </Field>

              <Field>
                <FieldLabel>Moneda</FieldLabel>
                <VmInput
                  aria-label="Moneda"
                  value={draft.currency ?? 'DOP'}
                  disabled={saving}
                  maxLength={3}
                  placeholder="DOP"
                  onChange={(event) =>
                    updateField('currency', event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Banco destino</FieldLabel>
                <VmInput
                  aria-label="Banco destino"
                  value={draft.depositAccount?.bankName ?? ''}
                  disabled={saving}
                  placeholder="Banco Popular"
                  onChange={(event) =>
                    updateDepositAccountField('bankName', event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Tipo de cuenta destino</FieldLabel>
                <VmSelect
                  aria-label="Tipo de cuenta destino"
                  selectedKey={draft.depositAccount?.accountType ?? 'checking'}
                  isDisabled={saving}
                  onSelectionChange={(key) =>
                    updateDepositAccountField(
                      'accountType',
                      String(key) as NonNullable<
                        HrEmployeeInput['depositAccount']
                      >['accountType'],
                    )
                  }
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value>
                      {
                        HR_DEPOSIT_ACCOUNT_TYPE_LABELS[
                          draft.depositAccount?.accountType ?? 'checking'
                        ]
                      }
                    </VmSelect.Value>
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox aria-label="Tipos de cuenta destino">
                      {Object.entries(HR_DEPOSIT_ACCOUNT_TYPE_LABELS).map(
                        ([value, label]) => (
                          <VmListBox.Item
                            key={value}
                            id={value}
                            textValue={label}
                          >
                            {label}
                            <VmListBox.ItemIndicator />
                          </VmListBox.Item>
                        ),
                      )}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field>
                <FieldLabel>Número de cuenta destino</FieldLabel>
                <VmInput
                  aria-label="Número de cuenta destino"
                  value={draft.depositAccount?.accountNumber ?? ''}
                  disabled={saving}
                  inputMode="numeric"
                  placeholder="0000000000"
                  onChange={(event) =>
                    updateDepositAccountField(
                      'accountNumber',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Titular</FieldLabel>
                <VmInput
                  aria-label="Titular de la cuenta destino"
                  value={draft.depositAccount?.holderName ?? ''}
                  disabled={saving}
                  placeholder={draft.fullName ?? 'Titular'}
                  onChange={(event) =>
                    updateDepositAccountField('holderName', event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Documento del titular</FieldLabel>
                <VmInput
                  aria-label="Documento del titular"
                  value={draft.depositAccount?.holderDocument ?? ''}
                  disabled={saving}
                  inputMode="numeric"
                  placeholder="000-0000000-0"
                  onChange={(event) =>
                    updateDepositAccountField(
                      'holderDocument',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <FullWidthField>
                <FieldLabel>Notas de la cuenta destino</FieldLabel>
                <VmInput
                  aria-label="Notas de la cuenta destino"
                  value={draft.depositAccount?.notes ?? ''}
                  disabled={saving}
                  placeholder="Referencia interna de nómina"
                  onChange={(event) =>
                    updateDepositAccountField('notes', event.target.value)
                  }
                />
              </FullWidthField>

              <FullWidthField>
                <FieldLabel>Referencia legacy de pago</FieldLabel>
                <VmInput
                  aria-label="Referencia legacy de pago"
                  value={draft.paymentDestination ?? ''}
                  disabled={saving}
                  placeholder="Dato anterior de cuenta o destino"
                  onChange={(event) =>
                    updateField('paymentDestination', event.target.value)
                  }
                />
                <FieldHint>
                  Se usa solo si no hay cuenta destino estructurada.
                </FieldHint>
              </FullWidthField>
            </FieldGrid>
          </EmployeeFormSection>

          <EmployeeFormSection id="deductions" title="Deducciones">
            <FieldGrid>
              <SalaryDeductionsSection
                baseSalaryAmount={toFiniteNumber(draft.baseSalaryAmount)}
                disabled={saving}
                value={draft.salaryDeductions}
                onChange={(salaryDeductions) =>
                  updateField('salaryDeductions', salaryDeductions)
                }
              />
            </FieldGrid>
          </EmployeeFormSection>

          <EmployeeFormSection id="notes" title="Notas internas">
            <FieldGrid>
              <FullWidthField>
                <FieldLabel>Notas</FieldLabel>
                <VmTextArea
                  aria-label="Notas"
                  value={draft.notes ?? ''}
                  disabled={saving}
                  rows={3}
                  placeholder="Notas internas"
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </FullWidthField>
            </FieldGrid>
          </EmployeeFormSection>
        </FormSections>
      </VmForm>
    </VmModal>
  );
}
