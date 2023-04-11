// export const responses = {
//     "ayuda": [
//       "Puedes visitar nuestra sección de ayuda en www.example.com/ayuda.",
//       "Visita www.example.com/ayuda para obtener más información."
//     ],
//     "hola":[
//         "Hola, ¿en qué puedo ayudarte?",
//         "Hola, ¿cómo puedo ayudarte?",
//         "Hola, ¿qué necesitas?",
//         "Hola, ¿qué deseas hacer?",
//         "Hola, ¿qué deseas hacer hoy?",
//     ],
//     "tutorial": [
//       "Puedes visitar nuestra sección de ayuda en www.example.com/ayuda."
//     ],
//     "version del sistema": [
//       "La versión actual del sistema es 1.0.0."
//     ],
//     "ruta": [
//       "Por favor, especifica la ruta a la que deseas acceder."
//     ]
//   };

 export const responses = [
    {
      keywords: ["hola", "hola!", "hola.", "¡hola!", "¡hola"],
      response: { text: "¡Hola! ¿Cómo puedo ayudarte?", path: null },
    },
    {
      keywords: ["adios", "adiós", "adios!", "adiós!", "¡adios!", "¡adiós!"],
      response: { text: "¡Adiós! Que tengas un buen día.", path: null },
    },
    {
      keywords: ["ayuda", "help", "ayuda!", "help!"],
      response: { text: "¿Necesitas ayuda? Estoy aquí para ayudarte.", path: null },
    },
    {
      keywords: ["configuracion", "configuración"],
      response: { text: "De acuerdo, te llevaré a la página de configuración.", path: "/app/settings" },
    },
    // Añade más reglas aquí
  ];
  

  

  