import { Space, Tabs, Typography } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

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

import type { TabsProps } from 'antd';

const { Title, Paragraph } = Typography;

type BusinessState = { id?: string } | null;

export const InvoiceV2Recovery: React.FC = () => {
  const business = useSelector(selectBusinessData) as BusinessState;

  const individual = useIndividualInvoiceRecovery({
    initialBusinessId:
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('businessId')
        : null) || business?.id,
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

  const tabItems: TabsProps['items'] = [
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
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <HeaderBlock>
              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  Recuperación de Invoice V2
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Alterna entre los flujos individual y masivo para diagnosticar
                  facturas, reprogramar tareas y optimizar el proceso de
                  recuperación.
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
