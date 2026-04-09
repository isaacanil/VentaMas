import React from 'react';
import styled from 'styled-components';

interface NoteViewerProps {
  title?: string;
  content: string;
}

export function NoteViewer({ title, content }: NoteViewerProps) {
  return (
    <NotaWrapper>
      {title && <TituloNota>{title}</TituloNota>}
      <ContenidoNota>{content}</ContenidoNota>
    </NotaWrapper>
  );
}

const NotaWrapper = styled.div`
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const TituloNota = styled.h2`
  margin-bottom: 5px;
  font-size: 1.2rem;
  font-weight: bold;
`;

const ContenidoNota = styled.p`
  font-size: 1rem;
  line-height: 1.5;
`;
