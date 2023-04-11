import { useState } from "react";
import styled from "styled-components";
import { FiSend } from "react-icons/fi";
import {  handleSubmit } from "./handleAssistantResponse";
import { useNavigate } from "react-router-dom";

export const FeedbackChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate()
  
 
  return (
    <>
      <OpenButton onClick={() => setIsOpen(!isOpen)}>
        <FiSend />
      </OpenButton>
      <Container isOpen={isOpen}>
        <Header>
          <Title>Assistant Ventamax</Title>
          <FiSend onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }} />
        </Header>
        <MessageList>
          {messages.map((message, index) => (
            <MessageItem key={index}>
              <MessageText sender={message.sender}>{message.text}</MessageText>
            </MessageItem>
          ))}
        </MessageList>
        <Form onSubmit={(event) => handleSubmit(event, messages, newMessage, setMessages, setNewMessage, navigate) }>
          <Input
            type="text"
            placeholder="Escribe tu mensaje aquí"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
          />
          <SubmitButton type="submit">Enviar</SubmitButton>
        </Form>
      </Container>
    </>
  );
};

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 500px;
  background-color: #f7f7f7;
  border-radius: 8px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: #5d5d5d;
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 400;
`;

const MessageList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 20px;
  height: 350px;
  overflow-y: scroll;
  display: grid;
  align-items: flex-start;
  align-content: flex-start;

  width: 100%;
`;

const MessageItem = styled.li`
  margin-bottom: 10px;

  width: 100%;
  justify-self: ${({ sender }) => (sender === "user" ? 'end' : 'start')};

`;

const MessageText = styled.p`
  margin: 0;
  padding: 8px;
  background-color: ${({ sender }) => (sender === "user" ? "var(--color)" : "white")};
  border-radius: 4px;
  max-width: 80%;
  width: fit-content;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  align-self: ${({ sender }) => (sender === "user" ? 'flex-end' : 'flex-start')};
  margin-left: ${({ sender }) => (sender === "user" ? 'auto' : '0')};
  margin-right: ${({ sender }) => (sender === "user" ? '0' : 'auto')};
`;

const Form = styled.form`
  display: flex;
  margin: 0;
  padding: 20px;
`;

const Input = styled.input`
  flex: 1;
  margin-right: 10px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
`;

const SubmitButton = styled.button`
  background-color: #5d5d5d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
`;

const OpenButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #5d5d5d;
  color: white;
  border: none;
  border-radius: 50%;
  padding: 15px;
  cursor: pointer;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;