import styled from 'styled-components';

export const SearchWrapper = styled.div`
  padding: 1.5em 1em 0;
`;

export const SearchInner = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;

  .ant-input-affix-wrapper {
    border-radius: 999px;
  }
`;

export const SearchOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const SearchOptionTitle = styled.span`
  font-weight: 600;
  color: rgb(0 0 0 / 88%);
`;

export const SearchOptionMeta = styled.span`
  font-size: 0.75rem;
  color: rgb(0 0 0 / 45%);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const SearchOptionDescription = styled.span`
  font-size: 0.85rem;
  line-height: 1.3;
  color: rgb(0 0 0 / 65%);
`;
