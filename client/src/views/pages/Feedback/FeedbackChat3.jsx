import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiSend, FiX } from "react-icons/fi";

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9999;
`;

const ChatContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: #3c3c3c;
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const Content = styled.div`
  padding: 20px;
`;

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Label = styled.div`
  padding: 6px 10px;
  background-color: ${(props) => props.color};
  color: white;
  border-radius: 4px;
  font-size: 14px;
  margin-right: 10px;
`;

const MessageList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
`;

const MessageItem = styled.li`
  margin-bottom: 10px;
`;

const MessageText = styled.p`
  margin: 0;
  padding: 8px;
  background-color: #f7f7f7;
  border-radius: 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 16px;
`;

const MessageTime = styled.span`
  font-size: 12px;
  color: #888;
  margin-left: 10px;
`;

const Form = styled.form`
  display: flex;
  margin: 0;
  padding: 20px 20px 10px 20px;
  border-top: 1px solid #eee;
`;

const Input = styled.input`
  flex: 1;
  margin-right: 10px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0
    .1);
`;

const SubmitButton = styled.button` 
background-color: #3c3c3c; 
color: white; 
border: none; 
border-radius: 4px; 
padding: 10px 20px; 
cursor: pointer; 
font-size: 16px;
`

const BackButton = styled.button `
background-color: transparent; 
color: #888; 
border: none; 
cursor: pointer; 
font-size: 14px;`

const Footer = styled.div` 
display: flex; 
justify-content: space-between; 
align-items: center; 
padding: 10px 20px; 
background-color: #f7f7f7; 
border-bottom-left-radius: 8px; 
border-bottom-right-radius: 8px;
`

export const FeedbackChat = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "visible";
        };
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (newMessage.trim() && selectedLabel.trim()) {
            setMessages([
                ...messages,
                { label: selectedLabel, text: newMessage.trim(), time: new Date() },
            ]);
            setNewMessage("");
        }
    };

    const handleLabelClick = (label) => {
        setSelectedLabel(label);
    };

    const handleClose = () => {
        document.body.style.overflow = "visible";
        setMessages([]);
        onClose();
    };

    return (
        <Container>
            <ChatContainer>
                <Header>
                    <Title>Feedback</Title>
                    <CloseButton onClick={handleClose}>
                        <FiX />
                    </CloseButton>
                </Header>
                <Content>
                    <LabelContainer>
                        <Label
                            color="#3c3c3c"
                            onClick={() => handleLabelClick("Error")}
                            style={{
                                backgroundColor: selectedLabel === "Error" ? "#3c3c3c" : "",
                                color: selectedLabel === "Error" ? "white" : "",
                            }}
                        >
                            Error
                        </Label>
                        <Label
                            color="#50c878"
                            onClick={() => handleLabelClick("Feature")}
                            style={{
                                backgroundColor: selectedLabel === "Feature" ? "#50c878" : "",
                                color: selectedLabel === "Feature" ? "white" : "",
                            }}
                        >
                            Feature
                        </Label>
                        <Label
                            color="#ff8c00"
                            onClick={() => handleLabelClick("Suggestion")}
                            style={{
                                backgroundColor:
                                    selectedLabel === "Suggestion" ? "#ff8c00" : "",
                                color: selectedLabel === "Suggestion" ? "white" : "",
                            }}
                        >
                            Suggestion
                        </Label>
                    </LabelContainer>
                    <MessageList>
                        {messages.map((message, index) => (
                            <MessageItem key={index}>
                                <MessageText>{message.text}</MessageText>
                                <MessageTime>
                                    {message.time.toLocaleTimeString()}
                                </MessageTime>
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
                </Content>
                <Footer>
                    <BackButton onClick={() => setSelectedLabel("")}
                    >
                        Back
                    </BackButton>
                    <div>
                        <button onClick={handleClose}>Close</button>
                        <button onClick={() => setMessages([])}>Clear</button>
                    </div>
                </Footer>
            </ChatContainer>
        </Container>
    );
};
