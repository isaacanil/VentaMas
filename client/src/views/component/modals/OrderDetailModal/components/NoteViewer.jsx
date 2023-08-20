import React from 'react';
import styled from 'styled-components';

export function NoteViewer({ title, content }) {


  return (

    <NotaWrapper>
      {title && <TituloNota>{title}</TituloNota>}
      <ContenidoNota>{content}</ContenidoNota>
    </NotaWrapper>

  );
}

const NotaWrapper = styled.div`
  background-color: #f2f2f2;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
`;

const TituloNota = styled.h2`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
`;

const ContenidoNota = styled.p`
  font-size: 1rem;
  line-height: 1.5;
`;



