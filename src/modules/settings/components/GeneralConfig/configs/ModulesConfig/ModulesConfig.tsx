import {
  Alert,
  Typography,
} from 'antd';
import {
  faBookOpen,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import ROUTES_NAME from '@/router/routes/routesName';

import ModuleCard from './components/ModuleCard';
import { useModulesConfig } from './hooks/useModulesConfig';

const { Paragraph, Title } = Typography;

const Page = styled.div`
  display: grid;
  gap: var(--ds-space-5);
  min-height: 100%;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-page);
`;

const Head = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const Grid = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

export default function ModulesConfig() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const userId = user?.uid ?? user?.id ?? null;
  const {
    accountingModule,
    error,
    setAccountingEnabled,
    setTreasuryEnabled,
    treasuryModule,
  } = useModulesConfig({
    businessId,
    userId,
  });

  return (
    <Page>
      <Head>
        <Title level={3} style={{ margin: 0 }}>
          Módulos
        </Title>
        <Paragraph style={{ margin: 0, color: 'var(--ds-color-text-secondary)' }}>
          Activa o desactiva los módulos grandes del negocio y entra a su
          configuración principal desde un solo lugar.
        </Paragraph>
      </Head>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      <Grid>
        <div
          id="modules-accounting"
          data-config-section="modules-accounting"
        >
          <ModuleCard
            checked={accountingModule.checked}
            description="Gobierna catálogo de cuentas, perfiles contables y las rutas protegidas de contabilidad."
            helperText={accountingModule.helperText}
            icon={<FontAwesomeIcon icon={faBookOpen} />}
            loading={accountingModule.loading}
            onConfigure={() => {
              navigate(
                ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
              );
            }}
            onToggle={(checked) => {
              void setAccountingEnabled(checked);
            }}
            status={accountingModule.status}
            summary={accountingModule.summary}
            title="Contabilidad"
          />
        </div>

        <div id="modules-treasury" data-config-section="modules-treasury">
          <ModuleCard
            checked={treasuryModule.checked}
            configureDisabled={treasuryModule.configureDisabled}
            description="Agrupa la operación financiera diaria: cuentas bancarias, cuadre de caja y la futura cuenta de caja."
            helperText={treasuryModule.helperText}
            icon={<FontAwesomeIcon icon={faWallet} />}
            loading={treasuryModule.loading}
            onConfigure={() => {
              navigate(ROUTES_NAME.TREASURY_TERM.TREASURY_BANK_ACCOUNTS);
            }}
            onToggle={(checked) => {
              void setTreasuryEnabled(checked);
            }}
            status={treasuryModule.status}
            summary={treasuryModule.summary}
            title="Tesorería"
          />
        </div>
      </Grid>
    </Page>
  );
}
