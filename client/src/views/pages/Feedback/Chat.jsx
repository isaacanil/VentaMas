// App.js
import React, { useState } from "react";
import styled from "styled-components";
import { generateResponse } from "./generateResponse";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8f9fa;
`;

const ChatWindow = styled.div`
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const InputContainer = styled.div`
  width: 100%;
  display: flex;
  margin-top: 20px;
`;

const Input = styled.input`
  flex: 1;
  border: 1px solid #ced4da;
  border-radius: 5px;
  padding: 5px 10px;
`;

const SendButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const Message = styled.div`
  margin-bottom: 10px;

  span {
    display: block;
    background-color: ${({ user }) => (user ? "#007bff" : "#f8f9fa")};
    color: ${({ user }) => (user ? "white" : "black")};
    border-radius: 5px;
    padding: 5px;
    max-width: 80%;
    word-wrap: break-word;
    ${({ user }) => (user ? "align-self: flex-end;" : "")}
  }
`;

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const handleMessageSend = () => {
    if (inputMessage.trim() !== "") {
      setMessages([...messages, { text: inputMessage, user: true }]);
      setInputMessage("");
        
      // Genera una respuesta utilizando la función generateResponse.
      const botResponse = generateResponse(inputMessage);
  
      setTimeout(() => {
        setMessages([
          ...messages,
          { text: inputMessage, user: true },
          { text: botResponse, user: false },
        ]);
      }, 1000);
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleMessageSend();
    }
  };

  return (
    <Container>
      <ChatWindow>
        {messages.map((message, index) => (
          <Message key={index} user={message.user}>
            <span>{message.text}</span>
          </Message>
        ))}
      </ChatWindow>
      <InputContainer>
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <SendButton onClick={handleMessageSend}>Enviar</SendButton>
      </InputContainer>
    </Container>
  );
}


