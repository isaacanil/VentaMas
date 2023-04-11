export function handleRutasIntent(input) {
    const rutas = {
      configuracion: 
      { 
        path: '/app/settings', 
        title: 'Configuración',  
        text: 'Puedes ir a Configuración.' 
    },
      perfil: { 
        path: '/app/settings',  
        title: 'Perfil',  
        text: 'Puedes Editar tu perfil desde la configuración de tu cuenta.' 
    },
  
    };
    const pregunta = input.toLowerCase();
    const respuesta = rutas[pregunta];
    const respuestaDefault = { text: 'Lo siento, no tengo información sobre eso. ¿Puedo ayudarte con algo más?' };
  
    return respuesta || respuestaDefault;
  }