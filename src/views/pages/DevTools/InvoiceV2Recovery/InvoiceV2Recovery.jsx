import { Space, Tabs, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectBusinessData } from '../../../../features/auth/businessSlice';
import { userAccess } from '../../../../hooks/abilities/useAbilities';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import { BulkRecoveryTab } from './components/BulkRecoveryTab';
import { IndividualRecoveryTab } from './components/IndividualRecoveryTab';
import {
  Content,
  ContentInner,
  HeaderBlock,
  PageWrapper,
} from './components/StyledComponents';
import { useBulkInvoiceRecovery } from './hooks/useBulkInvoiceRecovery';
import { useIndividualInvoiceRecovery } from './hooks/useIndividualInvoiceRecovery';

const { Title, Paragraph } = Typography;

export const InvoiceV2Recovery = () => {
  const navigate = useNavigate();
  const business = useSelector(selectBusinessData);
  const { abilities, loading: loadingAbilities } = userAccess();

  const individual = useIndividualInvoiceRecovery({
    initialBusinessId: business?.id,
    initialInvoiceId:
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('invoiceId')
        : null,
  });
  const bulk = useBulkInvoiceRecovery({
    getSelectedBusinessId: () =>
      individual.watchedBusinessId ||
      individual.form.getFieldValue('businessId'),
  });

  useEffect(() => {
    if (!loadingAbilities) {
      const canAccess = abilities?.can('developerAccess', 'all');
      if (!canAccess) {
        navigate('/home', { replace: true, state: { unauthorized: true } });
      }
    }
  }, [abilities, loadingAbilities, navigate]);

  const tabItems = [
    {
      key: 'individual',
      label: 'Recuperación individual',
      children: <IndividualRecoveryTab {...individual} />,
    },
    {
      key: 'bulk',
      label: 'Recuperación masiva',
      children: <BulkRecoveryTab {...bulk} />,
    },
  ];

  return (
    <PageWrapper>
      <MenuApp sectionName="Soporte Facturación V2" data={[]} />
      <Content>
        <ContentInner>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <HeaderBlock>
              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  Recuperación de Invoice V2
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Alterna entre los flujos individual y masivo para diagnosticar facturas,
                  reprogramar tareas y optimizar el proceso de recuperación.
                </Paragraph>
              </div>
            </HeaderBlock>

            <Tabs defaultActiveKey="individual" items={tabItems} />
          </Space>
        </ContentInner>
      </Content>
    </PageWrapper>
  );
};

export default InvoiceV2Recovery;
