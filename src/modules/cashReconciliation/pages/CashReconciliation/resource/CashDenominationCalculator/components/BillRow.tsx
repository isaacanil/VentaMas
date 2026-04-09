import { InputNumber } from 'antd';
import styled from 'styled-components';
import { formatPrice } from '@/utils/format';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';
import type { CashCountBanknote } from '@/utils/cashCount/types';

interface BillRowProps {
  bill: CashCountBanknote;
  index: number;
  inputDisabled?: boolean | null;
  readOnly?: boolean;
  updateBillQuantity: (index: number, value: number | null) => void;
}

export const BillRow: React.FC<BillRowProps> = ({
  bill,
  index,
  inputDisabled,
  readOnly = false,
  updateBillQuantity,
}) => {
  const total = Number(bill.value) * Number(bill.quantity || 0);
  const formattedTotal = formatPrice(total);

  return (
    <BillRowContainer>
      <BillRef>{bill.ref}</BillRef>
      <InputNumber
        min={0}
        value={bill.quantity as number | undefined}
        readOnly={readOnly}
        disabled={!!inputDisabled}
        onChange={(value) => updateBillQuantity(index, value)}
        placeholder={'cantidad'}
        style={{ width: '100%' }}
        aria-label={`Cantidad para denominacion ${bill.ref}`}
      />
      <FormattedValue
        type={'subtitle'}
        value={formattedTotal}
        size={'small'}
        align={'right'}
      />
    </BillRowContainer>
  );
};

const BillRowContainer = styled.div`
  display: grid;
  grid-template-columns: 3em 10em 1fr;
  gap: 1.4em;
  align-items: center;
  border-radius: var(--border-radius);
`;

const BillRef = styled.div`
  width: 3.4em;
  text-align: right;
`;
