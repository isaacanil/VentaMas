import styled from 'styled-components';

const ChatMessage = ({ message, navigate }) => {
  const isBotMessage = !message.user; // si el campo user no está definido, entonces es un mensaje del bot

  return (
    <MessageWrapper isBotMessage={isBotMessage} key={message.id}>
      {!isBotMessage && <User isUserMessage={!isBotMessage}>{message.user}</User>}
      <BotText >{message.bot.text}</BotText>
      {message.bot.image && <BotImage isUserMessage={isBotMessage} src={message.bot.image} alt="Imagen" />}
      {message.bot.icon && <BotIcon>{message.bot.icon}</BotIcon>}
      {message.bot.link && <BotLink href={message.bot.link}>Enlace</BotLink>}
      {message.path && (
        <NavigationButton onClick={() => navigate(message.path)}>
          Ir a {message.bot.title}
        </NavigationButton>
      )}
    </MessageWrapper>
  );
};

const MessageWrapper = styled.div`
  display: grid;
   
  margin-bottom: 16px;

`;

const User = styled.p`
  margin-bottom: 4px;
    border-radius: 4px;
 word-wrap: break-word;
    padding: 2px 8px;
    width: fit-content;
    max-width: 600px;
    justify-self: ${({ isUserMessage }) => (isUserMessage ? 'end' : 'start')};
    background-color: ${({ isUserMessage }) => (isUserMessage ? '#c4e6ff' : 'inherit')};
    
`;

const BotText = styled.p`
  margin-bottom: 8px;
  width: fit-content;
  max-width: 600px;
  padding: 2px 8px;
  border-radius: 4px;
    word-wrap: break-word;
  justify-self: ${({ isUserMessage }) => (!isUserMessage ? 'start' : 'start')};
  background-color: ${({ isUserMessage }) => (!isUserMessage ? '#bbf7be' : 'inherit')};
`;

const BotImage = styled.img`
  max-width: 100%;
  margin-bottom: 8px;
`;

const BotIcon = styled.span`
  margin-right: 8px;
`;

const BotLink = styled.a`
  color: #0077cc;
  text-decoration: underline;
  margin-bottom: 8px;
`;

const NavigationButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #0077cc;
  color: #ffffff;
  width: fit-content;
  cursor: pointer;

  &:hover {
    background-color: #005fa3;
  }
`;

export default ChatMessage;
