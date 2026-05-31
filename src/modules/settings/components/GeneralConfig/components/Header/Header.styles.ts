import { Button } from 'antd';
import styled from 'styled-components';

export const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
`;

export const Controls = styled.div`
  display: flex;
  gap: 8px;
`;

export const StyledButton = styled(Button)`
  display: flex;
  align-items: center;

  .anticon {
    margin-right: 4px;
  }
`;
