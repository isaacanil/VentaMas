import type { ReactNode } from 'react';

import {
  ActivityContent,
  ActivityDesc,
  ActivityIconWrap,
  ActivityRow,
  ActivityTime,
  ActivityTitle,
} from './ActivityItem.styles';

interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
}

export const ActivityItem = ({
  icon,
  title,
  description,
  time,
}: ActivityItemProps) => (
  <ActivityRow>
    <ActivityIconWrap>{icon}</ActivityIconWrap>
    <ActivityContent>
      <ActivityTitle>{title}</ActivityTitle>
      <ActivityDesc>{description}</ActivityDesc>
    </ActivityContent>
    <ActivityTime>{time}</ActivityTime>
  </ActivityRow>
);
