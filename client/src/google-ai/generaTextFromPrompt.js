import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY
// Función para generar texto usando la API de Google Generative AI
export async function generateTextFromPrompt(prompt) {
  try {
    // Crear el contenido del prompt
    let contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    // Inicializar la API de Google Generative AI con la clave
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Configurar el modelo
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-002",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
    // Generar el contenido
    const {response} = await model.generateContent({ contents });
    return response.candidates[0].content.parts[0].text; // Devolver el resultado generado
  } catch (error) {
    throw new Error(`Error generating text: ${error.message}`);
  }
}
