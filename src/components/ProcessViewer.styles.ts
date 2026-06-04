import { m } from 'framer-motion';
import styled from 'styled-components';

export const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 50%);
`;

export const ProcessCard = styled(m.div)`
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
`;

export const StatusText = styled(m.h2)`
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  overflow: hidden;
  background: #eee;
  border-radius: 5px;
`;

export const ProgressFill = styled(m.div)<{ $error: boolean }>`
  width: 100%;
  height: 100%;
  background: ${({ $error }) => ($error ? '#ff4d4f' : '#4caf50')};
  transform-origin: left center;
`;

export const ProductInfo = styled(m.div)`
  padding: 1rem;
  margin-top: 1rem;
  background: #f5f5f5;
  border-radius: 8px;

  h3 {
    margin: 0;
    color: #333;
  }

  p {
    margin: 0.5rem 0 0;
    color: #666;
  }
`;
