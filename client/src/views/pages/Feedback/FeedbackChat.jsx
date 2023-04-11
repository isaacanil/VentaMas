import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiSend } from "react-icons/fi";
import { generateResponse } from "./generateResponse";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f7f7f7;
  z-index: 9999;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: #5d5d5d;
  color: white;
`;

const Title = styled.h2`
  margin: 0;
`;

const MessageList = styled.ul`
  list-style: none;
  display: grid;
  align-items: flex-start;

  padding: 2em calc( 20px + 4vw ) 0;
  height: calc(100vh - 150px);
  width: 100%;
  overflow-y: scroll;
`;

const user = {
    id: 1,
    name: "John Doe",
};

const isCurrentUser = (message) => message.senderId === user.id;

const MessageItem = styled.li`
  margin-bottom: 10px;
  justify-self: ${props => isCurrentUser(props.message) ? 'end' : 'start'};
`;
const MessageText = styled.p`
  margin: 0;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 60vw;
  align-self: ${props => isCurrentUser(props.message) ? 'flex-end' : 'flex-start'};
  margin-left: ${props => isCurrentUser(props.message) ? 'auto' : '0'};
  margin-right: ${props => isCurrentUser(props.message) ? '0' : 'auto'};
`;
const Form = styled.form`
  display: flex;
  margin: 0;
  padding: 20px;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
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


export const FeedbackChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const navigate = useNavigate()
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "visible";
      };
    }, []);
  
    const handleSubmit = (event) => {
        event.preventDefault();
        if (newMessage.trim()) {
          setMessages([...messages, { text: newMessage.trim(), senderId: 1 }]);
          setNewMessage("");
    
          // Genera una respuesta utilizando la función generateResponse.
          const botResponse = generateResponse(newMessage);
    
          setTimeout(() => {
            setMessages([...messages, { text: newMessage.trim(), senderId: 1 }, { text: botResponse.text, senderId: 2 }]);
            if (botResponse.route) {
                setTimeout(() => {
                    
              navigate(botResponse.route);
                }, 3000);
            }
          }, 1000);
        }
      };
  
    const handleClose = () => {
      document.body.style.overflow = "visible";
      setMessages([]);
    };
  
    return (
      <Container>
        <Header>
          <Title>Feedback</Title>
          <FiSend onClick={handleClose} />
        </Header>
        <MessageList>
          {messages.map((message, index) => (
            <MessageItem key={index} message={message}>
              <MessageText message={message}>{message.text}</MessageText>
            </MessageItem>
          ))}
        </MessageList>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Type your message here"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
          />
          <SubmitButton type="submit">Send</SubmitButton>
        </Form>
      </Container>
    );
  };