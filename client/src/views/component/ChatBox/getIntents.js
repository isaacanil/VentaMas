import nlp from "compromise/three";

export const getIntent = (text) => {
    const doc = nlp(text);
    let intent = 'desconocido'; 
    switch (true) {
      case doc.match('hola').found:
        intent = 'saludo';
        break;
      case doc.match('adiós').found:
        intent = 'despedida';
        break;
      case doc.match('configuracion').found:
        intent = 'rutas';
        break;
      case doc.match('perfil').found:
        intent = 'rutas';
        break;
      case doc.match('mensajes').found:
        intent = 'rutas';
        break;
    }
  
    return intent;
  };
  