import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #007bff;
  color: #fff;
  font-size: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #0062cc;
    animation: ${pulse} 0.5s ease-in-out;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
  }
`;

const BackButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/settings');
  };

  return (
    <Button onClick={handleClick}>
      <FaArrowLeft />
    </Button>
  );
};

export default BackButton;
