import styled from 'styled-components';

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

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
