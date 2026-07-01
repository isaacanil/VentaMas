import styled from 'styled-components';

import { VmButton, VmInput } from '@/components/heroui';

export const SelectorContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ds-space-3);
  width: 100%;
`;

export const SearchShell = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const SearchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  color: var(--ds-color-text-muted);
`;

export const SearchInput = styled(VmInput)`
  flex: 1 1 auto;
  min-width: 0;
`;

export const ClearSearchButton = styled(VmButton)`
  flex: 0 0 auto;
`;

export const ClientList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  max-height: min(52dvh, 26rem);
  min-height: 12rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
`;

export const ClientListItem = styled.li`
  min-width: 0;
`;

export const ClientOption = styled(VmButton)`
  width: 100%;
  height: auto;
  min-height: 3.25rem;
  justify-content: flex-start;
  padding: var(--ds-space-2) var(--ds-space-3);
  text-align: left;
`;

export const ClientOptionContent = styled.span`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
  width: 100%;
`;

export const ClientAvatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: var(--color-primary, #1890ff);
  color: #fff;
  font-size: 0.85rem;
`;

export const ClientDetails = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

export const ClientName = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ClientMeta = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-muted);
  font-size: 0.75rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StateBlock = styled.div`
  display: grid;
  min-height: 12rem;
  place-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-6) var(--ds-space-4);
  color: var(--ds-color-text-muted);
  text-align: center;
`;

export const StateTitle = styled.p`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: 0.9rem;
  font-weight: 650;
`;

export const StateDescription = styled.p`
  max-width: 18rem;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.25rem;
`;
