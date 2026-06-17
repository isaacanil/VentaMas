import { Button } from 'antd';
import styled from 'styled-components';

export const Section = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 1rem;
  margin-bottom: 2rem;
  background: #fff;
  border-radius: 8px;
`;

export const ImageContainer = styled.div`
  position: relative;

  .ant-image img {
    max-height: 300px;
    object-fit: contain;
  }
`;

export const DeleteBtn = styled(Button)`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: #fff;
  background: rgb(0 0 0 / 60%);
  border: none;

  &:hover {
    background: rgb(0 0 0 / 80%);
  }
`;
