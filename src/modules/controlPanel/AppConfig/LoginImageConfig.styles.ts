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
