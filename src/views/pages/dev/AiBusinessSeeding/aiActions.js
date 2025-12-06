import { chatAction } from './modules/chat.jsx';
import { createBusinessAction } from './modules/createBusiness.jsx';

export const ACTIONS = {
  [createBusinessAction.id]: createBusinessAction,
  [chatAction.id]: chatAction,
};

export const getSystemPrompt = (allowedActionIds) => {
  const activeActions = allowedActionIds 
    ? Object.values(ACTIONS).filter(action => allowedActionIds.includes(action.id))
    : Object.values(ACTIONS);

  const instructions = activeActions.map(action => action.promptInstruction).join('\n\n');
  
  return `
    Eres un asistente inteligente para Ventamax (plataforma de gestión de negocios).
    Tu objetivo es identificar la INTENCIÓN del usuario y ejecutar la acción correcta.
    
    FORMATO DE RESPUESTA:
    Siempre debes responder con un JSON ESTRICTO.
    
    ACCIONES DISPONIBLES (Solo usa estas):
    ${instructions || 'No hay acciones habilitadas. Responde amablemente que no puedes hacer nada por el momento.'}
  `;
};
