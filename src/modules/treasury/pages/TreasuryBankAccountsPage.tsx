import BusinessFeatureRouteGate from '@/components/availability/BusinessFeatureRouteGate';
import { PageLayout } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';
import TreasuryBankAccountsWorkspace from './components/TreasuryBankAccountsWorkspace';

export default function TreasuryBankAccountsPage() {
  return (
    <BusinessFeatureRouteGate
      feature="treasury"
      fallbackTo={ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_MODULES}
    >
      <BusinessFeatureRouteGate
        feature="accounting"
        fallbackTo={ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_MODULES}
      >
        <PageLayout>
          <MenuApp sectionName="Tesorería" />
          <TreasuryBankAccountsWorkspace />
        </PageLayout>
      </BusinessFeatureRouteGate>
    </BusinessFeatureRouteGate>
  );
}
