import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

import {
  Controls,
  HeaderContainer,
  StyledButton,
  Title,
} from './Header.styles';

interface HeaderProps {
  title: string;
  onSave?: (() => void) | null;
}

export const Header = ({ title, onSave }: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = () => {
    onSave?.();
  };

  return (
    <HeaderContainer>
      <StyledButton type="link" onClick={handleBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> Volver
      </StyledButton>
      <Title>{title}</Title>
      <Controls>
        {onSave && (
          <StyledButton type="primary" onClick={handleSave}>
            <FontAwesomeIcon icon={faSave} /> Guardar
          </StyledButton>
        )}
      </Controls>
    </HeaderContainer>
  );
};
