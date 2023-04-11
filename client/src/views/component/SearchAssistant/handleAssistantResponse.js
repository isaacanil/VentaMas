import { useNavigate } from "react-router-dom";
import { responses } from "./response";
function findResponse(input) {
    for (const rule of responses) {
      if (rule.keywords.includes(input)) {
        return rule.response;
      }
    }
    return null;
  }
export const generateResponse = (input) => {
    input = input.toLowerCase().trim();
    const response = findResponse(input);
  
    if (response) {
      return response;
    }
  
    return { text: "Lo siento, no entiendo tu pregunta.", path: null };
  };

export const handleSubmit = (event, messages, newMessage, setMessages, setNewMessage, navigate) => {
    event.preventDefault();
   
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage.trim(), sender: 'user' }]);
      const assistantResponse = generateResponse(newMessage.trim());
      setMessages((prevMessages) => [...prevMessages, { text: assistantResponse.text, sender: 'assistant', path: assistantResponse.path }]);
      setNewMessage("");

      setTimeout(() => {
        setMessages([...messages, { text: newMessage.trim(), sender: 'user' }, { text: assistantResponse.text, sender: 'assistant' }]);
        if (assistantResponse.path) {
            setTimeout(() => { 
          navigate(assistantResponse.path);
            }, 3000);
        }
      }, 1000);
    }
  };