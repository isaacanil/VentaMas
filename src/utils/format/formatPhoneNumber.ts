import { formatPhoneForLegacyDisplay } from '@/shared/phone/phoneNumber';

export type PhoneFormatHint = string | boolean;

export const formatPhoneNumber = (
  input = '',
  _formatHint?: PhoneFormatHint,
): string => formatPhoneForLegacyDisplay(input, _formatHint);
