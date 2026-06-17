import React from 'react';
import { DateTime } from 'luxon';

import {
  getDateStatus,
  getDateStatusConfig,
} from '@/config/statusActionConfig';
import { toMillis } from '@/utils/date/dateUtils';

import { BadgeDate } from './BadgeDate';

import type { ConfigItem } from '@/config/statusActionConfig';
import type { TimestampLike } from '@/utils/date/types';

interface EnhancedDateDisplayProps {
  timestamp: TimestampLike;
}

export const EnhancedDateDisplay: React.FC<EnhancedDateDisplayProps> = ({
  timestamp,
}) => {
  const millis = toMillis(timestamp);
  const dateTime = millis ? DateTime.fromMillis(millis) : null;
  if (!dateTime) return <span>-</span>;

  const status = getDateStatus(timestamp);
  const config: ConfigItem = getDateStatusConfig(status.status);

  return <BadgeDate dateTime={dateTime} config={config} />;
};
