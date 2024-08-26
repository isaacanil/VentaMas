import PropTypes from 'prop-types';
import styled from 'styled-components';
import Typography from '../../../../templates/system/Typografy/Typografy';
import { selectUser } from '../../../../../features/auth/userSlice';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { useSelector } from 'react-redux';

const Greeting = styled.h1`
  font-size: 20px;
  color: #333;
`;

const Name = styled.span`
  color: #007BFF;
  font-weight: bold;
`;

const PersonalizedGreeting = ({ greetingText = 'Bienvenido de vuelta' }) => {
  const user = useSelector(selectUser)
  const business = useSelector(selectBusinessData)

  if(!user) return null
  
  const capitalizedFirstName = user?.username?.charAt(0)?.toUpperCase() + user?.username?.slice(1);

  return (
    <div>
      <Typography variant='h3' disableMargins>
        {greetingText}, <Name>{capitalizedFirstName}</Name>
      </Typography>
      <BusinessName>
        {business && business?.name}
      </BusinessName>
    </div>
  );
};

PersonalizedGreeting.propTypes = {
  name: PropTypes.string.isRequired,
  greetingText: PropTypes.string,
};

export default PersonalizedGreeting;
const BusinessName = styled.div`
  
`