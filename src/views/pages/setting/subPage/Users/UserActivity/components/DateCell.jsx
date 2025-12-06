import { DateTime } from 'luxon';
import styled from 'styled-components';

export const DateCell = ({ millis }) => {
  if (!millis) return <span>-</span>;
  const dt = DateTime.fromMillis(millis);
  return (
    <DateCellContainer>
      <span className="date">{dt.toLocaleString(DateTime.DATE_MED)}</span>
      <span className="time">
        {dt.toLocaleString(DateTime.TIME_WITH_SECONDS)}
      </span>
    </DateCellContainer>
  );
};

const DateCellContainer = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  .date {
    font-weight: 500;
    color: ${({ theme }) => theme?.text?.primary || '#1f1f1f'};
  }
  .time {
    font-size: 0.75rem;
    color: ${({ theme }) => theme?.text?.secondary || '#6b7280'};
  }
`;
