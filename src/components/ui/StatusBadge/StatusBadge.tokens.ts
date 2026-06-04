import type { StatusBadgeTone, ToneTokens } from './StatusBadge.types';

export const toneTokens: Record<StatusBadgeTone, ToneTokens> = {
  neutral: {
    subtleBg: 'var(--ds-color-bg-subtle)',
    subtleText: 'var(--ds-color-text-secondary)',
    solidBg: 'var(--ds-color-text-secondary)',
    solidText: 'var(--ds-color-text-inverse)',
  },
  success: {
    subtleBg: 'var(--ds-color-state-success-subtle)',
    subtleText: 'var(--ds-color-state-success-text)',
    solidBg: 'var(--ds-color-state-success)',
    solidText: 'var(--ds-color-state-on-success)',
  },
  warning: {
    subtleBg: 'var(--ds-color-state-warning-subtle)',
    subtleText: 'var(--ds-color-state-warning-text)',
    solidBg: 'var(--ds-color-state-warning)',
    solidText: 'var(--ds-color-state-on-warning)',
  },
  danger: {
    subtleBg: 'var(--ds-color-state-danger-subtle)',
    subtleText: 'var(--ds-color-state-danger-text)',
    solidBg: 'var(--ds-color-state-danger)',
    solidText: 'var(--ds-color-state-on-danger)',
  },
  info: {
    subtleBg: 'var(--ds-color-state-info-subtle)',
    subtleText: 'var(--ds-color-state-info-text)',
    solidBg: 'var(--ds-color-state-info)',
    solidText: 'var(--ds-color-state-on-info)',
  },
};

export const statusToneMap: Record<string, StatusBadgeTone> = {
  completed: 'success',
  pending: 'warning',
  canceled: 'danger',
  processing: 'info',
  overdue: 'danger',
  today: 'info',
  warning: 'warning',
  upcoming: 'success',
  onTime: 'success',
  invalid: 'neutral',
  default: 'neutral',
};
