import { getIntent } from "./getIntents";
import { handleDefaultIntent, INTENT_ROUTER } from "./INTENT_Router";


export const handleSend = ({input, setInput, setMessages}) => {
    if (!input) return;
  
    const intent = getIntent(input);
    const intentHandler = INTENT_ROUTER[intent] || handleDefaultIntent;
    const response = intentHandler(input);
  
    const message = {
      user: input,
      bot: response.message || response,
      path: response.path || null
    };
  
    setMessages((prevMessages) => [    ...prevMessages,    message,  ]);
    setInput('');
  };