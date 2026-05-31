import styled from 'styled-components';

export const Card = styled.section`
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 12px 36px rgb(15 23 42 / 5%);
`;

export const CardHeader = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

export const HeaderIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 14px;
`;

export const HeaderCopy = styled.div`
  display: grid;
  gap: 4px;
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
`;

export const CardDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
`;

export const Grid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

export const ToolCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
`;

export const ToolIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f8fafc;
  color: #334155;
  font-size: 14px;
`;

export const ToolTitle = styled.h4`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
`;

export const ToolDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
`;
