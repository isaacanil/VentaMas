import styled from 'styled-components';

export const Asterisk = styled.span`
  padding-left: 8px;
  color: red;

  svg {
    font-size: 0.8em;
  }
`;

export const OtherContainer = styled.div`
  display: flex;
`;

export const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
  height: min-content;
`;

export const Head = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 0 0 0.2em;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--white);
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius-light);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

export const Body = styled.div`
  position: absolute;
  z-index: 20;
  width: 100%;
  min-width: 300px;
  height: 300px;
  max-height: 300px;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid rgb(0 0 0 / 20%);
  border-radius: 6px;
  box-shadow: 0 0 20px rgb(0 0 0 / 20%);
`;

export const List = styled.ul`
  z-index: 1;
  display: block;
  height: 100%;
  padding: 0;
  overflow-y: auto;
`;

export const Group = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.2em;
  padding-right: 0.5em;

  h3 {
    display: -webkit-box;
    width: 100%;
    margin: 0 0 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    font-size: 1em;
    font-weight: 500;
    line-height: 1.2;
    color: rgb(66 66 66);
    text-transform: uppercase;
  }
`;

interface ItemProps {
  $selected?: boolean;
}

export const Item = styled.button<ItemProps>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.4em;
  padding: 0 1em;
  color: rgb(66 66 66);
  text-align: left;
  list-style: none;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    color: white;
    background-color: var(--color);
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: -2px;
  }

  ${({ $selected }) => {
    if ($selected) {
      return `
        background-color: #4081d6;
        color: white;
      `;
    }
  }}
`;

export const Icon = styled.div`
  display: flex;
  align-items: center;
  width: 0.8em;
  height: 1em;
`;

export const SearchSection = styled.div`
  position: sticky;
  top: 0;
  padding: 0.2em;
  background-color: var(--white-2);
  border-bottom: 1px solid rgb(0 0 0 / 10%);
`;

export const NoneItemMessageContainer = styled.div`
  padding: 1em;
`;

interface LabelProps {
  $labelVariant?: 'primary' | 'label2' | 'label1';
}

export const Label = styled.label<LabelProps>`
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--gray-5);

  ${({ $labelVariant }) => {
    switch ($labelVariant) {
      case 'primary':
        return `
          font-size: 11px;
          color: #353535;
          position: absolute;
          z-index: 1;
          background-color: white;
          padding: 0 4px;
          top: -5px;
          line-height: 1;
          height: min-content;
          font-weight: 600;
          ::after {
            content: ' :';
          }
        `;
      case 'label2':
        return `
          font-size: 16px;
          color: black;
          margin-bottom: 10px;
          display: block;
        `;
      default:
        return `
          font-size: 13px;
          color: var(--gray-5);
          margin-bottom: 4px;
        `;
    }
  }}
`;
