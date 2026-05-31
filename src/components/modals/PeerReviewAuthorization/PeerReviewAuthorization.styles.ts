import type { CSSProperties } from 'react';
import styled from 'styled-components';

export const PEER_REVIEW_MODAL_STYLES: { body: CSSProperties } = {
  body: {
    padding: '0px',
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2em',
  },
};

export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2em;
  padding: 8px 12px;
  margin: 0;
  margin-top: 1em;
  font-size: 1em;
  font-weight: 500;
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
`;
