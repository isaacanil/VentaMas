import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';

export const PageContainer = styled(PageShell)`
  display: flex;
  flex-direction: column;
`;

export const PageContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fff;
`;

export const PageProductGroupsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 12px;
`;
