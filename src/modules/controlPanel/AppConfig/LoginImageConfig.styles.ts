import { Button } from 'antd';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';

export const Page = styled(PageShell)`
  background: #f0f2f5;
`;

export const Content = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  max-width: 900px;
  padding: 0 1rem;
  margin: 2rem auto;
`;

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

export const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
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

export const ProgressBar = styled.div`
  max-width: 600px;
  margin: 0 auto 1rem;
`;

export const Stats = styled.div`
  text-align: center;

  p {
    margin: 4px 0;
  }
`;
