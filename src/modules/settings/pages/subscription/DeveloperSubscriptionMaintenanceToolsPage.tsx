import { PageContent } from './DeveloperSubscriptionMaintenancePage.styles';

import DeveloperMaintenanceHub from './components/DeveloperMaintenanceHub';
import { useDeveloperSubscriptionMaintenanceContext } from './useDeveloperSubscriptionMaintenanceContext';

const DeveloperSubscriptionMaintenanceToolsPage = () => {
  const { openDevModal } = useDeveloperSubscriptionMaintenanceContext();

  return (
    <PageContent>
      <DeveloperMaintenanceHub onOpenModal={openDevModal} />
    </PageContent>
  );
};

export default DeveloperSubscriptionMaintenanceToolsPage;
