import React from 'react';
import styled from 'styled-components';

const Highlight = styled.span`
  background-color: #ffff00b5;
`;

export const renderHighlightedText = (text, highlight) => {
  if (!highlight) return text;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <Highlight key={index}>{part}</Highlight>
    ) : (
      part
    ),
  );
};
