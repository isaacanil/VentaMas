import { motion } from 'framer-motion';
import { useRef } from 'react';
import styled from 'styled-components';
import { formatNumber, formatPrice } from '@/utils/format';
import { FormattedValue } from '@/views/templates/system/FormattedValue/FormattedValue';
import type { CashCountBanknote } from '@/utils/cashCount/types';
import { BillRow } from './components/BillRow';
import { OpenControllerSmall } from './OpenControllerSmall';
import { OpenControllerWithMessage } from './OpenControllerWithMessage';

interface CashDenominationCalculatorProps {
  isExpanded?: boolean | null;
  readOnly?: boolean;
  inputDisabled?: boolean | null;
  banknotes: CashCountBanknote[];
  setBanknotes: (notes: CashCountBanknote[]) => void;
  setIsExpanded?: (value: boolean) => void;
  datetime?: React.ReactNode;
  title?: string;
  width?: 'small' | string;
  columns?: 'auto' | '1' | '2';
}

export const CashDenominationCalculator: React.FC<CashDenominationCalculatorProps> = ({
  isExpanded = null,
  readOnly = false,
  inputDisabled = null,
  banknotes,
  setBanknotes,
  setIsExpanded,
  datetime,
  title,
  width,
  columns,
}) => {
  const bills = banknotes;
  const billsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleExpanded = () => {
    if (setIsExpanded) {
      setIsExpanded(!isExpanded);
    }
  };

  const totalAmount = bills.reduce(
    (acc, bill) => acc + bill.value * Number(bill.quantity || 0),
    0,
  );

  const banknoteVariants = {
    open: { opacity: 1, height: 'auto' },
    closed: { overflow: 'hidden', height: '4em' },
  };

  return (
    <Container width={width} ref={billsContainerRef}>
      <Header>
        <Group>
          <FormattedValue size={'small'} type={'title'} value={title} />
        </Group>
        <Group>
          {datetime && <FormattedValue size={'xsmall'} value={datetime} />}
          <OpenControllerSmall
            onClick={handleExpanded}
            isExpanded={isExpanded}
          />
        </Group>
      </Header>
      <Bills
        animate={isExpanded ? 'open' : 'closed'}
        variants={banknoteVariants}
        transition={{ duration: 0.5 }}
        columns={columns}
      >
        {bills
          .slice()
          .reverse()
          .map((bill, index) => (
            <BillRow
              key={`${bill.ref}-${index}`}
              bill={bill}
              inputDisabled={inputDisabled}
              readOnly={readOnly}
              index={index}
              updateBillQuantity={(rowIndex, value) => {
                const updated = [...bills];
                updated[bills.length - 1 - rowIndex] = {
                  ...updated[bills.length - 1 - rowIndex],
                  quantity: value ?? 0,
                };
                setBanknotes(updated);
              }}
            />
          ))}
        <OpenControllerWithMessage
          isExpanded={isExpanded}
          handleExpanded={handleExpanded}
        />
      </Bills>
      <TotalBills>
        <FormattedValue size={'small'} type={'title'} value={'Total:'} />
        <FormattedValue
          size={'small'}
          align={'right'}
          type={'title'}
          value={formatNumber(
            bills.reduce((acc, bill) => acc + Number(bill.quantity || 0), 0),
          )}
        />
        <FormattedValue
          size={'small'}
          type={'title'}
          align={'right'}
          value={formatPrice(totalAmount)}
        />
      </TotalBills>
    </Container>
  );
};

const Container = styled.div<{ width?: string }>`
  box-sizing: border-box;
  display: grid;
  font-family: 'Poppins', monospace;
  ${({ width }) =>
    width === 'small' &&
    `
        max-width: 20em;
    `}
  background-color: white;
  border-radius: var(--border-radius);
  border: 1px solid #e2e2e2;
`;
const Bills = styled(motion.div)<{ columns?: 'auto' | '1' | '2' }>`
  padding: 0.6em;
  display: grid;
  gap: 0.4em;
  overflow: hidden;
  position: relative;

  ${({ columns }) => {
    switch (columns) {
      case 'auto':
        return `
                grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
            `;
      case '1':
        return `
                grid-template-columns: 1fr;
            `;
      case '2':
        return `
                grid-template-columns: repeat(2, 1fr);
            `;
      default:
        return `
                grid-template-columns: 1fr;
            `;
    }
  }}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6em;
  border-bottom: 1px solid var(--gray-2);
`;
const TotalBills = styled.div`
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 3.6em 10em 1fr;
  gap: 0.8em;
  padding: 0.4em;
  font-weight: bold;
  border-top: 1px solid var(--gray-2);

  span {
    &:nth-child(2) {
      text-align: right;
    }

    &:last-child {
      text-align: right;
    }
  }
`;
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;
