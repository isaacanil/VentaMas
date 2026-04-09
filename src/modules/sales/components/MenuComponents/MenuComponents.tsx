import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { MenuConfig } from './MenuConfig';

export const MenuComponents = () => {
  const dispatch = useDispatch();
  const menuItems = MenuConfig.filter((item) => item.id !== 'preorder');

  return (
    <Container>
      <Items>
        {menuItems.map((item, index) => (
          <Item key={item.id || `menu-item-${index}`} $align={item.align}>
            <Button
              type="primary"
              size="large"
              icon={item.icon}
              onClick={() => item.onclick?.(dispatch)}
            >
              {item.title}
            </Button>
          </Item>
        ))}
      </Items>
    </Container>
  );
};
const Container = styled.div`
  display: none;

  @media (width <= 800px) {
    z-index: 1;
    display: flex;
    align-items: center;
    width: 100%;
    height: 4em;
    padding: 0.8em 1.2em;
    overflow: hidden;
    background-color: rgb(255 255 255 / 85%);
    border-top: 1px solid rgb(0 0 0 / 10%);
    box-shadow: 0 -2px 10px rgb(0 0 0 / 5%);
    backdrop-filter: blur(15px);
  }
`;
const Items = styled.ul`
  display: flex;
  gap: 0.8em;
  justify-content: end;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
`;
const Item = styled.li`
  ${({ $align }) => ($align === 'right' ? 'margin-left: auto;' : '')}
  ${({ $align }) => ($align === 'left' ? 'margin-right: auto;' : '')}
    
    .ant-btn {
    height: 2.5em;
    font-size: 0.95em;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;
