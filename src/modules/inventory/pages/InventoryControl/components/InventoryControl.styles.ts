import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';

export const Container = styled(PageShell)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem;
`;

export const Component = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1em;
  width: 100%;
  max-width: 1440px;
  min-height: 0;
  padding: 0.75rem 1rem 1rem;
  margin: 0 auto;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #fff;
`;

export const HeaderBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`;

export const SearchInput = styled.input`
  width: clamp(240px, 40vw, 520px);
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgb(0 0 0 / 15%);
  border-radius: 6px;
`;

export const Controls = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
`;

export const SortButton = styled.button`
  height: 32px;
  padding: 0 10px;
  cursor: pointer;
  background: white;
  border: 1px solid rgb(0 0 0 / 15%);
  border-radius: 6px;
`;

export const TableContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
`;

export const FooterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
`;
