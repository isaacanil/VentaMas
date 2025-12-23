import { Space, Spin, Tabs, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import { BulkRecoveryTab } from './components/BulkRecoveryTab';
import { IndividualRecoveryTab } from './components/IndividualRecoveryTab';
import {
  Centered,
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
  const user = useSelector(selectUser);
  const { abilities, loading: loadingAbilities } = useUserAccess();

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

  const isDev = user?.role === 'dev';
  const hasRules = abilities?.rules?.length > 0;
  const isInitializing =
    user === false || loadingAbilities || (isDev && !hasRules);

  useEffect(() => {
    if (!isInitializing) {
      const canAccess = abilities?.can('developerAccess', 'all');
      if (!canAccess) {
        navigate('/home', { replace: true, state: { unauthorized: true } });
      }
    }
  }, [abilities, isInitializing, navigate]);

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

  if (isInitializing) {
    return (
      <PageWrapper>
        <MenuApp sectionName="Soporte Facturación V2" data={[]} />
        <Content>
          <ContentInner>
            <Centered>
              <Spin size="large" tip="Verificando permisos...">
                <div style={{ width: 200, height: 140 }} />
              </Spin>
            </Centered>
          </ContentInner>
        </Content>
      </PageWrapper>
    );
  }

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
