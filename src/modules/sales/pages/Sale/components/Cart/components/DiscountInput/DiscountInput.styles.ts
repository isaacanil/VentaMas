import { Button, InputNumber, Space } from 'antd';
import styled from 'styled-components';

export const Container = styled.div`
  position: relative;
`;

export const Wrapper = styled.div<{ $width?: string }>`
  position: relative;
  width: ${(props) => props.$width || '170px'};

  label {
    position: absolute;
    top: -8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: 12px;
    padding: 0 0.4em;
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: #353535;
    background-color: white;
    border-radius: 3px;
  }

  .ant-input-number-group-wrapper,
  .ant-input-number-wrapper,
  .ant-input-number {
    width: 100%;
  }

  .ant-input-number-group-addon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
`;

export const FullWidthCompact = styled(Space.Compact)`
  width: 100%;
`;

export const FullWidthInputNumber = styled(InputNumber)`
  width: 100%;
`;

export const DiscountButton = styled(Button)`
  color: rgb(0 0 0 / 88%);
  cursor: default;
  background-color: #fafafa;
  border-color: #d9d9d9;
`;

export const MenuOptions = styled.ul`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.2em;
  padding: 0;
  list-style: none;
`;

export const StyledMenu = styled.div`
  position: absolute;
  top: -58px;
  right: 0;
  z-index: 10;
  width: min-content;
  max-width: 500px;
  padding: 10px;
  margin: -80px 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 0 10px rgb(0 0 0 / 20%);
`;

export const StyledMenuItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2em;
  height: 2.4em;
  padding: 5px;
  cursor: pointer;
  background-color: #f3f3f3;
  border-radius: 4px;
`;
