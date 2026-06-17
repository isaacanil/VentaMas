import styled from 'styled-components';

export const SubNav = styled.div`
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
`;

export const SubNavInner = styled.div`
  display: flex;
  gap: 2px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 720px) {
    padding: 0 16px;
  }
`;

export const NavButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: ${(p) => (p.$active ? '#0f172a' : '#94a3b8')};
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: ${(p) => (p.$active ? '#0f172a' : '#475569')};
  }
`;

export const ActiveIndicator = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #18d6bb;
`;

export const Content = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background: #f8fafc;
`;

export const ContentInner = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 48px;

  @media (max-width: 720px) {
    padding: 20px 16px 40px;
  }
`;
