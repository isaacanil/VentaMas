import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
`;

const Button = styled.button`
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
  background-color: #007bff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #0062cc;
    animation: ${pulse} 0.5s ease-in-out;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgb(0 123 255 / 50%);
  }
`;

const BackButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/settings');
  };

  return (
    <Button onClick={handleClick}>
      <FontAwesomeIcon icon={faArrowLeft} />
    </Button>
  );
};

export default BackButton;
