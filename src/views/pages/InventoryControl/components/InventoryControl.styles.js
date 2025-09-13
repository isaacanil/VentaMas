import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1rem;
  height: 100%;
`

export const Component = styled.div`
  width: 98vw;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 1em;
  margin: 0 auto;
  height: 100%;
  background-color: #ffffff;
  overflow: hidden;
  padding: 0 1em 1em;
`

export const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`

export const SearchInput = styled.input`
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 6px;
  width: clamp(240px, 40vw, 520px);
`

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

export const SortButton = styled.button`
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0,0,0,.15);
  background: white;
  border-radius: 6px;
  cursor: pointer;
`

export const TableContainer = styled.div`
  min-height: 0;
  height: 100%;
`

export const FooterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .5rem;
`

