import { handleComentariosIntent } from "./Intents/handleComentariosIntent";
import { handleFaqsIntent } from "./Intents/handleFaqsIntent";
import { handleRutasIntent } from "./Intents/handlePathIntent";
import { handleSaludoIntent } from "./Intents/handleSaludoIntent";




export const INTENT_ROUTER = {
    saludo: handleSaludoIntent,
    faqs: handleFaqsIntent,
    comentarios: handleComentariosIntent,
    rutas: handleRutasIntent
};

export function handleDefaultIntent(input) {
    const respuestaDefault = {text: 'Lo siento, no he entendido lo que has dicho. ¿Podrías reformular tu pregunta?'};
    return respuestaDefault;
  }