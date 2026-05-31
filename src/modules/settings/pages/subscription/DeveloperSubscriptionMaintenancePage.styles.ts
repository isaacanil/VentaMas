import styled from 'styled-components';

export const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const InlineNotice = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 12px;
  background: #ffffff;
`;

export const InlineNoticeText = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
`;
