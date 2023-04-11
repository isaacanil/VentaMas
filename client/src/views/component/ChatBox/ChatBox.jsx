import React, { Fragment, useEffect, useRef, useState } from 'react';
import { handleSend } from './handleSend';
import styled from 'styled-components';
import { Chat } from './Chat';

export const ChatBox = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const ref = useRef();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <Wrapper ref={ref}>
    <Input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onFocus={() => setIsChatOpen(true)}
      placeholder="Escribe un mensaje..."
    />
    <Button onClick={() => handleSend({ input, setInput, setMessages })}>Enviar</Button>
    {isChatOpen && <Chat messages={messages}/>}
  </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: right;
  align-items: center;
  height: 3em;
  gap: 1em;
  position: relative;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
`;

const ChatWrapper = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-top: 10px;
  font-size: 16px;
`;

const ChatMessage = styled.div`
  background-color: #f2f2f2;
  border-radius: 5px;
  padding: 5px;
  margin-bottom: 5px;
`;