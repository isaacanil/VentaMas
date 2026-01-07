// @ts-nocheck
import styled from 'styled-components';

export const PageWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const Content = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-y: auto;
`;

export const ContentInner = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 24px;

  @media (width <= 768px) {
    padding: 16px;
  }
`;

export const HeaderBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Centered = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`;

export const CodeBlock = styled.div`
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
  }
`;
