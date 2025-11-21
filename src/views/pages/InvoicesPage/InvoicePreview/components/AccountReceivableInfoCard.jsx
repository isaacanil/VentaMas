import { faFileInvoiceDollar, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { AccountReceivableItem } from './AccountReceivableItem';

export const AccountReceivableInfoCard = ({
    accountsReceivable = [],
    client,
}) => {
    if (!accountsReceivable.length) {
        return null;
    }

    return (
        <StyledCard>
            <CardHeader>
                <CardTitle>
                    <FontAwesomeIcon icon={faFileInvoiceDollar} />
                    Cuentas por Cobrar
                </CardTitle>
            </CardHeader>

            <CardContent>
                <Section>
                    <SectionTitle>
                        Detalles de la Cuenta
                        <Tooltip title="Información de la cuenta por cobrar asociada a esta factura">
                            <FontAwesomeIcon
                                icon={faCircleInfo}
                                style={{ marginLeft: '4px', color: '#999' }}
                            />
                        </Tooltip>
                    </SectionTitle>
                    <ItemsList>
                        {accountsReceivable.map((ar, index) => (
                            <AccountReceivableItem
                                key={ar.id || index}
                                ar={ar}
                                client={client}
                            />
                        ))}
                    </ItemsList>
                </Section>
            </CardContent>
        </StyledCard>
    );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const Section = styled.div`
  margin-bottom: 0;
`;

const SectionTitle = styled.h4`
  display: flex;
  align-items: center;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
