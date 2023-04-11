import { FaSmile } from "react-icons/fa";

export function handleSaludoIntent(input) {
    const SALUDO_RESPUESTAS = [
      {
        text: '¡Hola! ¿En qué puedo ayudarte?',
        icon: <FaSmile/>,
      },
      {
        text: 'Hola, ¿cómo estás?',
        icon: <FaSmile/>,
      },
      {
        text: '¡Buen día! ¿En qué puedo ayudarte?',
        icon: <FaSmile/>,
      },
    ];
    const randomIndex = Math.floor(Math.random() * SALUDO_RESPUESTAS.length);
    return SALUDO_RESPUESTAS[randomIndex];
  }