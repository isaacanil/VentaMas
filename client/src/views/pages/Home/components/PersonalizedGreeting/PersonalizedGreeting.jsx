import PropTypes from 'prop-types';
import styled from 'styled-components';

const Greeting = styled.h1`
  font-size: 20px;
  color: #333;
`;

const Name = styled.span`
  color: #007BFF;
  font-weight: bold;
`;

const PersonalizedGreeting = ({ name, greetingText = '¡Bienvenido de nuevo' }) => {
  if (!name) {
    throw new Error('Se requiere un nombre para el saludo personalizado');
  }

  const capitalizedFirstName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <Greeting>
      {greetingText}, <Name>{capitalizedFirstName}</Name>!
    </Greeting>
  );
};

PersonalizedGreeting.propTypes = {
  name: PropTypes.string.isRequired,
  greetingText: PropTypes.string,
};

export default PersonalizedGreeting;
