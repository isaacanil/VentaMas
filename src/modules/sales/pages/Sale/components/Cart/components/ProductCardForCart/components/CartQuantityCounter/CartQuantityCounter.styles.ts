import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  overflow: hidden;
  background-color: #f5f5f7;
  border: 1px solid #ddd;
  border-radius: 10px;
`;

export const ButtonCounter = styled.button`
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  padding: 0;
  cursor: pointer;
  background-color: #f5f5f5;
  border: none;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #eaeaea;
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color, #1677ff);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const CounterDisplay = styled.input`
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  font-variant-numeric: tabular-nums;
  text-align: center;
  background-color: white;
  border: none;

  &:focus-visible {
    outline: 2px solid var(--primary-color, #1677ff);
    outline-offset: -2px;
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }
`;

export const CounterIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  color: #555;
  user-select: none;
`;
