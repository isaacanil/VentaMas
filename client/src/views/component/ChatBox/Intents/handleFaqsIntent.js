export function handleFaqsIntent(input) {
    const preguntasFrecuentes = {
      '¿Cómo cambio mi contraseña?': {
        text: 'Puedes cambiar tu contraseña desde la configuración de tu cuenta.',
        path: '/configuracion',
        image: 'https://ejemplo.com/imagen-configuracion.png',
        link: 'https://ejemplo.com/ayuda',
      },
      '¿Cuál es la política de reembolso?': {
        text:
          'Nuestra política de reembolso es de 30 días. Si no estás satisfecho con nuestro producto, puedes solicitar un reembolso dentro de los 30 días posteriores a la compra.',
        path: '/politicas',
        image: 'https://ejemplo.com/imagen-politicas.png',
        link: 'https://ejemplo.com/ayuda',
      },
      '¿Cómo contacto al soporte técnico?': {
        text:
          'Puedes contactar a nuestro soporte técnico por correo electrónico o teléfono. Los detalles de contacto están disponibles en nuestro sitio web.',
        path: '/soporte',
        image: 'https://ejemplo.com/imagen-soporte.png',
        link: 'https://ejemplo.com/ayuda',
      },
      // Agrega más preguntas frecuentes y respuestas aquí
    };
    const respuestaDefault =
     { text: 'Lo siento, no tengo información sobre eso. Por favor contáctanos para más ayuda.'};
  
    const pregunta = input.toLowerCase();
    const respuesta = preguntasFrecuentes[pregunta] || respuestaDefault;
    return respuesta;
  }