import { DateTime } from 'luxon';
import styled from 'styled-components';
import type { TimestampLike } from '@/utils/date/types';

interface DateSectionProps {
  date?: TimestampLike;
}

export const DateSection: React.FC<DateSectionProps> = ({ date }) => {
  let currentDate: DateTime | null = null;
  let parsedDate = date;

  if (typeof parsedDate === 'string') {
    try {
      parsedDate = JSON.parse(parsedDate);
    } catch (error) {
      console.error('Error parsing date string:', error);
    }
  }
  if (typeof parsedDate === 'number') {
    currentDate = DateTime.fromMillis(parsedDate);
  } else if (parsedDate && typeof (parsedDate as { toMillis?: () => number }).toMillis === 'function') {
    currentDate = DateTime.fromMillis(
      (parsedDate as { toMillis: () => number }).toMillis(),
    );
  }

  const formattedDate = currentDate
    ? currentDate.toLocaleString(DateTime.DATE_SHORT)
    : '';
  const formattedTime = currentDate ? currentDate.toFormat('hh:mm a') : '';

  return (
    parsedDate &&
    currentDate && (
      <Container>
        <DateContainer>
          <span>{formattedDate}</span>
          <span>{formattedTime}</span>
        </DateContainer>
      </Container>
    )
  );
};
const Container = styled.div``;
const DateContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  align-items: center;
  font-size: 14px;
`;
