import styled from 'styled-components';

type StatusType = 'info' | 'warning';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SectionContainer = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #fdfdfdff;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
`;

export const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const InfoTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
`;

export const InfoDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgb(31 41 51 / 60%);
`;

export const ToggleButton = styled.button<{ $checked: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 24px;
  padding: 0;
  cursor: pointer;
  background-color: ${({ $checked }) => ($checked ? '#2abf88' : '#b8c2cc')};
  border: none;
  border-radius: 999px;
  outline: none;
  transition: background-color 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const ToggleThumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? '22px' : '2px')};
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgb(15 23 42 / 30%);
  transition: left 0.2s ease;
`;

export const StatusContainer = styled.div``;

export const StatusCard = styled.div<{ $type: StatusType }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: ${({ $type }) =>
    $type === 'info' ? 'rgba(42, 191, 136, 0.12)' : 'rgba(245, 158, 11, 0.15)'};
  border: 1px solid
    ${({ $type }) =>
      $type === 'info'
        ? 'rgba(42, 191, 136, 0.35)'
        : 'rgba(245, 158, 11, 0.35)'};
  border-radius: 10px;
`;

export const StatusHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const StatusIndicator = styled.span<{ $type: StatusType }>`
  width: 10px;
  height: 10px;
  background-color: ${({ $type }) =>
    $type === 'info' ? '#2abf88' : '#f59e0b'};
  border-radius: 50%;
`;

export const StatusTitle = styled.span<{ $type: StatusType }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ $type }) => ($type === 'info' ? '#0f5132' : '#8a3b00')};
`;

export const StatusDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgb(31 41 51 / 75%);
`;

export const HistoryLink = styled.button`
  align-self: flex-start;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1570ef;
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #0b4abf;
  }
`;

export const ModulesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fb;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
`;

export const ModulesTitle = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
`;

export const ModulesDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgb(31 41 51 / 65%);
`;

export const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

export const ModuleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background-color: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1570ef;
    box-shadow: 0 2px 8px rgb(21 112 239 / 10%);
  }
`;

export const ModuleHeader = styled.div`
  display: flex;
  align-items: center;
`;

export const ModuleLabel = styled.span`
  margin-left: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2933;
`;

export const ModuleDescription = styled.p`
  margin: 0 0 0 24px;
  font-size: 13px;
  line-height: 1.4;
  color: rgb(31 41 51 / 60%);
`;
