import { Typography } from 'antd';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import VentamaxLogo from '@/assets/logo/ventamax.svg';

const { Text } = Typography;

interface ChatActionData {
  message?: string;
}

interface ChatAction {
  id: string;
  name: string;
  description: string;
  promptInstruction: string;
  execute: (data: ChatActionData) => Promise<ChatActionData>;
  PreviewComponent: React.FC<{ data: ChatActionData }>;
  ResultComponent: null;
}

export const chatAction: ChatAction = {
  id: 'chat',
  name: 'Chat General',
  description: 'Responde preguntas generales y guía al usuario.',

  promptInstruction: `
    SI el usuario hace preguntas generales, saluda, o necesita ayuda:
    Retorna JSON con:
    {
      "action": "chat",
      "data": {
         "message": "Tu respuesta en texto plano. Sé amable y útil. Solo menciona las capacidades que están disponibles según las otras acciones listadas."
      }
    }
    IMPORTANTE: No ofrezcas funcionalidades que no estén en las ACCIONES DISPONIBLES.
  `,

  execute: async (data: ChatActionData) => {
    // Chat no requiere ejecución en backend, solo retorna el mensaje
    return data;
  },

  PreviewComponent: ({ data }: { data: ChatActionData }) => (
    <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '20px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        textAlign: 'left',
        alignItems: 'flex-start',
        display: 'flex',
        gap: '1rem'
    }}>
        <div style={{ width: 40, height: 40, background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={VentamaxLogo} alt="Ventamax AI" style={{ width: '24px', height: 'auto' }} />
        </div>
        <div style={{ flex: 1 }}>
            <Text style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6' }}>
                <ReactMarkdown>{data.message ?? ''}</ReactMarkdown>
            </Text>
        </div>
    </div>
  ),
  
  ResultComponent: null // Chat is instant, no result state needed separately usually
};
