import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { MenuConfig } from './MenuConfig';

export const MenuComponents = () => {
  const dispatch = useDispatch();

  return (
    <Container>
      <Items>
        {MenuConfig.filter((item) => item.id !== 'preorder').map(
          (item, index) => {
            return (
              <Item key={index} align={item.align}>
                <Button
                  type="primary"
                  size="large"
                  icon={item.icon}
                  onClick={() => item.onclick(dispatch)}
                >
                  {item.title}
                </Button>
              </Item>
            );
          },
        )}
      </Items>
    </Container>
  );
};
const Container = styled.div`
  display: none;
  @media (max-width: 800px) {
    height: 4em;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(15px);
    overflow: hidden;
    display: flex;
    z-index: 1;
    align-items: center;
    padding: 0.8em 1.2em;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }
`;
const Items = styled.ul`
  display: flex;
  width: 100%;
  list-style: none;
  justify-content: end;
  margin: 0;
  padding: 0;
  gap: 0.8em;
`;
const Item = styled.li`
  ${(props) => (props.align === 'right' ? 'margin-left: auto;' : '')}
  ${(props) => (props.align === 'left' ? 'margin-right: auto;' : '')}
    
    .ant-btn {
    height: 2.5em;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: none;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;
