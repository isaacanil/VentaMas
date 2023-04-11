import React, { Fragment, useState } from 'react';
import { handleDefaultIntent, INTENT_ROUTER } from './INTENT_Router';
import { getIntent } from './getIntents';
import { useNavigate } from 'react-router-dom';
import { handleSend } from './handleSend';
import styled from 'styled-components';
import ChatMessage from './ChatMessage';

export const Chat = ({ messages, isOpen }) => {
    const navigate = useNavigate();
    return (
        <ChatWrapper isOpen={isOpen}>
            <ChatHeader>
                <h3>Asistente</h3>
            </ChatHeader>
            <ChatBody>
                {messages.slice().reverse()
                    .map((message, index) => (
                        <ChatMessage message={message} key={index} navigate={navigate}></ChatMessage>
                    ))}
            </ChatBody>
        </ChatWrapper>
    );
};

const ChatWrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  max-width: 1000px;
  width: 100%;
 top: 4em;
  display: grid;
    grid-template-rows: min-content 1fr;
  height: calc(100vh - 9.5em);
  background-color: #fff;
  /* border: 1px solid #ccc; */
   border-radius: 5px;
  /* box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);  */
  z-index: 9999;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  /* background-color: #eee; */
  /* border-bottom: 1px solid #ccc; */
  cursor: pointer;

  h3 {
    margin: 0;
  }
`;

const ChatBody = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 10px;
`;

