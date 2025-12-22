import { InputNumber } from 'antd';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { FormattedValue } from '../../../../../templates/system/FormattedValue/FormattedValue';

export const BillRow = ({
  bill,
  index,
  inputDisabled,
  readOnly = false,
  updateBillQuantity,
}) => {
  const formattedTotal = formatPrice(bill.value * bill.quantity);

  return (
    <BillRowContainer>
      <BillRef>{bill.ref}</BillRef>
      <InputNumber
        min={0}
        value={bill.quantity}
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

BillRow.propTypes = {
  bill: PropTypes.shape({
    ref: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  inputDisabled: PropTypes.bool,
  updateBillQuantity: PropTypes.func.isRequired,
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



