import React, { useState } from "react";
import styled from "styled-components";
import { FiSend } from "react-icons/fi";

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 500px;
  background-color: #f7f7f7;
  border-radius: 8px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
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
`;

const MessageList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 20px;
  height: 350px;
  overflow-y: scroll;
`;

const MessageItem = styled.li`
  margin-bottom: 10px;
`;

const MessageText = styled.p`
  margin: 0;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
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

export const FeedbackChatModal = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, newMessage.trim()]);
      setNewMessage("");
    }
  };

  return (
    <Container>
      <Header>
        <Title>Feedback</Title>
        <FiSend />
      </Header>
      <MessageList>
        {messages.map((message, index) => (
          <MessageItem key={index}>
            <MessageText>{message}</MessageText>
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


