import { faCalendarAlt, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { formatDate } from '../../../../../../../../../utils/formatDate';
import { formatPrice } from '../../../../../../../../../utils/formatPrice';

import { Payment } from './components/Payment';

export const AccountCard = ({
  account,
  frequency,
  balance,
  installments,
  installmentAmount,
  lastPayment,
  lastPaymentDate,
  isActive,
}) => {
  // const formatDate = (dateValue) => {
  //   console.log(dateValue)
  //   if (!dateValue) return 'N/A';
  //   if (dateValue.seconds) {
  //     return new DateTime(dateValue.seconds * 1000).toFormat('dd/MM/yyyy');
  //   }
  //   return new DateTime(dateValue).toFormat('dd/MM/yyyy');
  // };

  const getPaidInstallments = () => {
    return account?.paidInstallments?.length || 0;
  };

  const getStatusTag = () => {
    const paid = getPaidInstallments();
    const total = installments;
    const percentage = (paid / total) * 100;

    if (percentage === 100) return 'completed';
    if (percentage >= 50) return 'progress';
    if (percentage > 0) return 'started';
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <AccountInfo>
          <AccountNumber>
            <FontAwesomeIcon icon={faReceipt} />
            <span>#{account.numberId}</span>
          </AccountNumber>
          <AccountDate>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>{formatDate(account.createdAt)}</span>
          </AccountDate>
        </AccountInfo>
        <HeaderMeta>
          <FrequencyTag frequency={frequency}>{frequency}</FrequencyTag>
        </HeaderMeta>
      </CardHeader>

      <FinancialDetails>
        <DetailsRow>
          <DetailGroup>
            <GroupContent>
              <GroupItem>
                <GroupLabel>Cuota:</GroupLabel>
                <GroupValue>{formatPrice(installmentAmount)}</GroupValue>
              </GroupItem>
              <GroupItem>
                <GroupLabel>Pagadas:</GroupLabel>
                <GroupValue $status={getStatusTag()}>
                  {getPaidInstallments()}/{installments}
                </GroupValue>
              </GroupItem>
            </GroupContent>
          </DetailGroup>

          <DetailGroup>
            <GroupContent>
              <GroupItem>
                <GroupLabel>Último Pago:</GroupLabel>
                <GroupValue>
                  {account?.lastPaymentDate
                    ? `${formatPrice(account.lastPayment)} - ${formatDate(account.lastPaymentDate)}`
                    : 'N/A'}
                </GroupValue>
              </GroupItem>
            </GroupContent>
          </DetailGroup>
        </DetailsRow>
      </FinancialDetails>

      <ActionBar>
        <Payment
          installmentAmount={installmentAmount}
          installments={installments}
          lastPayment={lastPayment}
          lastPaymentDate={lastPaymentDate}
          isActive={isActive}
          balance={balance}
          account={account}
        />
      </ActionBar>
    </Card>
  );
};

const Card = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    border-color: #d9d9d9;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
`;

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AccountNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;

  svg {
    font-size: 12px;
    color: #666;
  }
`;

const AccountDate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;

  svg {
    font-size: 11px;
    color: #999;
  }
`;

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const FrequencyTag = styled.div`
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f5f5f5;
  color: #666;
`;

const FinancialDetails = styled.div``;

const DetailsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
`;

const DetailGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4px 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;

  justify-content: flex-start;
`;

const GroupContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  gap: 12px;
  justify-content: center;
`;

const GroupItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const GroupLabel = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const GroupValue = styled.span`
  font-size: 14px;
  color: #333;
  font-weight: 600;

  ${({ $isBalance, $isPaid }) =>
    $isBalance &&
    `
    color: ${$isPaid ? '#2e7d32' : '#cf1322'};
    font-weight: 700;
    font-size: 16px;
  `}
`;

const ActionBar = styled.div``;

export const Payments = styled.div``;
