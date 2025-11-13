import styled from 'styled-components';

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1rem;
  height: 100%;
`;

export const Component = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 1em;
  width: 98vw;
  height: 100%;
  padding: 0 1em 1em;
  margin: 0 auto;
  overflow: hidden;
  background-color: #fff;
`;

export const HeaderBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
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
  height: 100%;
  min-height: 0;
`;

export const FooterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
`;
