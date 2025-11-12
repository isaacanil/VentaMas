import { motion } from 'framer-motion';
import { useRef } from 'react';
import styled from 'styled-components';

import { useFormatNumber } from '../../../../../hooks/useFormatNumber';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue';

import { BillRow } from './components/BillRow';
import { OpenControllerSmall } from './OpenControllerSmall';
import { OpenControllerWithMessage } from './OpenControllerWithMessage';

export const CashDenominationCalculator = ({
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
  const billsContainerRef = useRef(null);

  const handleExpanded = () => setIsExpanded(!isExpanded);

  const totalAmount = bills.reduce(
    (acc, bill) => acc + bill.value * bill.quantity,
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
              key={index}
              bill={bill}
              inputDisabled={inputDisabled}
              readOnly={readOnly}
              index={index}
              updateBillQuantity={(index, value) => {
                const updated = [...bills];
                updated[bills.length - 1 - index] = {
                  ...bills[bills.length - 1 - index],
                  quantity: value || '',
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
          value={useFormatNumber(
            bills.reduce((acc, bill) => acc + Number(bill.quantity), 0),
          )}
        />
        <FormattedValue
          size={'small'}
          type={'title'}
          align={'right'}
          value={useFormatPrice(totalAmount)}
        />
      </TotalBills>
    </Container>
  );
};

const Container = styled.div`
  box-sizing: border-box;
  display: grid;
  font-family: 'Noto Sans Mono', monospace;
  ${({ width }) =>
    width === 'small' &&
    `
        max-width: 20em;
    `}
  background-color: white;
  border-radius: var(--border-radius);
  border: 1px solid #e2e2e2;
`;
const Bills = styled(motion.div)`
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
  border-bottom: 1px solid var(--Gray2);
`;
const TotalBills = styled.div`
  border-top: 1px solid var(--Gray2);
  padding: 0.4em;
  display: grid;
  grid-template-columns: 3.6em 10em 1fr;
  gap: 0.8em;
  font-weight: bold;
  position: sticky;
  bottom: 0;
  span {
    :nth-child(2) {
      text-align: right;
    }
    :last-child {
      text-align: right;
    }
  }
`;
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;
