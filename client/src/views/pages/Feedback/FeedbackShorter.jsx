import React from 'react';
import styled from 'styled-components';
import { FiSend } from 'react-icons/fi';

const FeedbackContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #fff;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
`;

const FeedbackInput = styled.input`
  flex: 1;
  margin-right: 10px;
  border: none;
  font-size: 16px;
  &:focus {
    outline: none;
  }
`;

const FeedbackButton = styled.button`
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const SendIcon = styled(FiSend)`
  margin-left: 10px;
`;

export const Feedback = () => {
  const [feedback, setFeedback] = React.useState('');

  const handleFeedbackChange = (event) => {
    setFeedback(event.target.value);
  };

  const handleFeedbackSubmit = () => {
    console.log(`Feedback: ${feedback}`);
    setFeedback('');
  };

  return (
    <FeedbackContainer>
      <FeedbackInput
        type="text"
        placeholder="Escribe tu feedback aquí..."
        value={feedback}
        onChange={handleFeedbackChange}
      />
      <FeedbackButton onClick={handleFeedbackSubmit}>
        Enviar
        <SendIcon />
      </FeedbackButton>
    </FeedbackContainer>
  );
};


