import {
  faFileInvoiceDollar,
  faHandHoldingDollar,
  faCartShopping,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Button, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';
import { DomainTable } from './components/DomainTable';
import { useAccountingAudit } from './hooks/useAccountingAudit';
import type { DomainKey } from './types';

const { Text } = Typography;

const PILOT_BUSINESS_ID = 'X63aIFwHzk3r0gmT8w6P';

type TabId = DomainKey;

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'invoices', label: 'Facturas', icon: <FontAwesomeIcon icon={faFileInvoiceDollar} /> },
  { id: 'accountsReceivablePayments', label: 'Pagos CxC', icon: <FontAwesomeIcon icon={faHandHoldingDollar} /> },
  { id: 'purchases', label: 'Compras', icon: <FontAwesomeIcon icon={faCartShopping} /> },
  { id: 'expenses', label: 'Gastos', icon: <FontAwesomeIcon icon={faReceipt} /> },
];

const AccountingPilotAudit: React.FC = () => {
  const user = useSelector(selectUser);
  const businessId: string = user?.businessID ?? user?.activeBusinessId ?? '';
  const isPilot = businessId === PILOT_BUSINESS_ID;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('invoices');
  const { state, refresh } = useAccountingAudit();

  useEffect(() => {
    if (businessId) {
      refresh(businessId);
    }
  }, [businessId, refresh]);

  const activeResult = state[activeTab];

  return (
    <Wrapper>
      <MenuApp
        sectionName="Auditoría Monetary — Piloto"
        showBackButton
        onBackClick={() => navigate(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB)}
      />

      <SubNav>
        <SubNavInner>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <NavButton
                key={tab.id}
                type="button"
                $active={isActive}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive ? <ActiveIndicator /> : null}
              </NavButton>
            );
          })}
        </SubNavInner>
      </SubNav>

      <Content>
        <ContentInner>
          <Alert
            style={{ marginBottom: 20 }}
            type={isPilot ? 'success' : 'warning'}
            showIcon
            message={
              isPilot
                ? `Negocio activo: ${businessId} — es el piloto ✓`
                : `Negocio activo: ${businessId || '(sin sesión)'} — NO es el piloto`
            }
            description={
              !isPilot ? (
                <>
                  Los datos corresponden al negocio activo en sesión, que <strong>no</strong> es el
                  piloto <Text code>{PILOT_BUSINESS_ID}</Text>. Es probable que los documentos no
                  tengan campo <Text code>monetary</Text>.
                </>
              ) : undefined
            }
            action={
              <Button size="small" onClick={() => refresh(businessId)} disabled={!businessId}>
                Refrescar
              </Button>
            }
          />

          <DomainTable result={activeResult} title={TABS.find((t) => t.id === activeTab)?.label ?? ''} />
        </ContentInner>
      </Content>
    </Wrapper>
  );
};

export default AccountingPilotAudit;

const Wrapper = styled(PageShell)``;

const SubNav = styled.div`
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
`;

const SubNavInner = styled.div`
  display: flex;
  gap: 2px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 720px) {
    padding: 0 16px;
  }
`;

const NavButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: ${(p) => (p.$active ? '#0f172a' : '#94a3b8')};
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: ${(p) => (p.$active ? '#0f172a' : '#475569')};
  }
`;

const ActiveIndicator = styled.span`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #18d6bb;
`;

const Content = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background: #f8fafc;
`;

const ContentInner = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;

  @media (max-width: 720px) {
    padding: 20px 16px 40px;
  }
`;
