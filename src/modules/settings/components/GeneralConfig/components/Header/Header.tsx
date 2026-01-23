import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components para el Header
const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;

  .anticon {
    margin-right: 4px;
  }
`;

interface HeaderProps {
  title: string;
  onSave?: (() => void) | null;
}

export const Header = ({ title, onSave }: HeaderProps) => {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1); // Navega hacia atrás en el historial
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
