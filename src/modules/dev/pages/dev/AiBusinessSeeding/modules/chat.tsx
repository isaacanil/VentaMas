import { Typography } from 'antd';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import VentamaxLogo from '@/assets/logo/ventamax.svg';

import type { ActionDefinition, ActionPreviewProps } from '../types';

const { Text } = Typography;

interface ChatActionData {
  message?: string;
}

export const chatAction: ActionDefinition<ChatActionData> = {
  id: 'chat',
  name: 'Chat General',
  description: 'Responde preguntas generales y guía al usuario.',

  PreviewComponent: ({ data }: ActionPreviewProps<ChatActionData>) => (
    <div
      style={{
        textAlign: 'left',
        alignItems: 'flex-start',
        display: 'flex',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          background: '#e6f7ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={VentamaxLogo}
          alt="Ventamax AI"
          style={{ width: '24px', height: 'auto' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Text
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '15px',
            lineHeight: '1.6',
          }}
        >
          <ReactMarkdown>{data.message ?? ''}</ReactMarkdown>
        </Text>
      </div>
    </div>
  ),
};
