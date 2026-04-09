import type { ReactNode } from 'react';
import styled from 'styled-components';

interface EmptyStateProps {
  children: ReactNode;
}

export const EmptyState = ({ children }: EmptyStateProps) => {
  return <Wrapper>{children}</Wrapper>;
};

const Wrapper = styled.div`
  padding: 2rem;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 16px;
`;
