import { VmNumberField } from '@/components/heroui';
import type { HrSalaryDeductionLine } from '@/types/hrPayroll';
import {
  getSalaryDeductionRate,
  SALARY_DEDUCTION_PRESETS,
  upsertSalaryDeductionRate,
} from '@/utils/hrPayroll/salaryDeductions';

import {
  Field,
  FieldGrid,
  FieldHint,
  FieldLabel,
  FullWidthField,
} from '../HrEmployeeEditorModal.styles';

interface SalaryDeductionsSectionProps {
  baseSalaryAmount: number;
  disabled: boolean;
  onChange: (lines: HrSalaryDeductionLine[]) => void;
  value?: HrSalaryDeductionLine[] | null;
}

const formatEstimatedAmount = (baseSalaryAmount: number, rate: number) => {
  const amount = (Math.max(0, baseSalaryAmount) * Math.max(0, rate)) / 100;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export function SalaryDeductionsSection({
  baseSalaryAmount,
  disabled,
  onChange,
  value,
}: SalaryDeductionsSectionProps) {
  return (
    <FullWidthField>
      <FieldLabel>Deducciones del salario base</FieldLabel>
      <FieldHint>
        AFP, TSS e ITBIS salario quedan como obligacion por pagar.
      </FieldHint>
      <FieldGrid>
        {SALARY_DEDUCTION_PRESETS.map((preset) => {
          const rate = getSalaryDeductionRate(value, preset.id);
          return (
            <Field key={preset.id}>
              <FieldLabel>{preset.label} %</FieldLabel>
              <VmNumberField
                aria-label={`${preset.label} porcentaje`}
                minValue={0}
                maxValue={100}
                step={0.01}
                value={rate}
                isDisabled={disabled}
                onChange={(nextRate) =>
                  onChange(upsertSalaryDeductionRate(value, preset, nextRate))
                }
              >
                <VmNumberField.Group>
                  <VmNumberField.Input />
                </VmNumberField.Group>
              </VmNumberField>
              <FieldHint>
                {formatEstimatedAmount(baseSalaryAmount, rate)}
              </FieldHint>
            </Field>
          );
        })}
      </FieldGrid>
    </FullWidthField>
  );
}
