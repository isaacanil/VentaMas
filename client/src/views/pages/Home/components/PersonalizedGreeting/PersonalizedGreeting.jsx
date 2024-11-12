import PropTypes from 'prop-types';
import styled from 'styled-components';
import Typography from '../../../../templates/system/Typografy/Typografy';
import { selectUser } from '../../../../../features/auth/userSlice';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { generateTextFromPrompt } from '../../../../../google-ai/generaTextFromPrompt';

const Greeting = styled.h1`
  font-size: 20px;
  color: #333;
`;

const Name = styled.span`
  color: #007BFF;
  font-weight: bold;
`;


const PersonalizedGreeting = ({ greetingText = 'Bienvenid@' }) => {
  const user = useSelector(selectUser)
  const business = useSelector(selectBusinessData)

  const [personalizedMessage, setPersonalizedMessage] = useState(greetingText); // Estado para el mensaje generado
  const [loading, setLoading] = useState(false); // Estado de carga

  const realName = user?.realName?.trim();
  const username = user?.username?.trim();

  const nameToDisplay = realName || username || 'Usuario';
  
  const capitalizedFirstName = nameToDisplay;

  useEffect(() => {
    // Aquí simplemente usamos el nombre del usuario y el saludo neutral.
    const message = `${greetingText}, ${nameToDisplay}`;
    setPersonalizedMessage(message);
  }, [nameToDisplay, greetingText]);

  return (
    <div>
      <Typography variant='h3' disableMargins>
      {loading ? "Cargando..." : `${personalizedMessage}, `} 
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