import PropTypes from 'prop-types';
import styled from 'styled-components';
import Typography from '../../../../templates/system/Typografy/Typografy';

const Greeting = styled.h1`
  font-size: 20px;
  color: #333;
`;

const Name = styled.span`
  color: #007BFF;
  font-weight: bold;
`;

const PersonalizedGreeting = ({ name = 'Anónimo', greetingText = '¡Bienvenido de nuevo' }) => {

  const capitalizedFirstName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <Typography variant='h3'>
      {greetingText}, <Name>{capitalizedFirstName}</Name>!
    </Typography>
  );
};

PersonalizedGreeting.propTypes = {
  name: PropTypes.string.isRequired,
  greetingText: PropTypes.string,
};

export default PersonalizedGreeting;
