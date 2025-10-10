import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';

import { CombinedPill } from './components/CombinedPill';
import { SessionInfoModal } from './components/SessionInfoModal';

const PersonalizedGreeting = () => {
  const user = useSelector(selectUser);
  const business = useSelector(selectBusinessData);

  // Use the SessionInfoModal component
  const { showSessionInfo } = SessionInfoModal();

  const realName = user?.realName?.trim();
  const username = user?.username?.trim();
  const nameToDisplay = realName || username || 'Usuario';
  const logoUrl = business?.logoUrl || null;
  const businessName = business?.name || 'Tu Negocio';

  return (
    <Container onClick={showSessionInfo}>
      <CombinedPill 
        logoUrl={logoUrl} 
        businessName={businessName} 
        userName={nameToDisplay} 
      />
    </Container>
  );
};

export default PersonalizedGreeting;

const Container = styled.div`
  cursor: pointer;
  padding: 12px 0px;
  border-radius: 12px;
  transition: all 0.3s ease;
  max-width: 450px;
  

`;