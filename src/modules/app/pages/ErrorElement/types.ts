import type { ReactNode } from 'react';
import type { Variants } from 'framer-motion';

export type ErrorInfo = string | null | undefined;
export type ErrorStackTrace = string | null | undefined;

export interface ErrorElementProps {
  errorInfo?: ErrorInfo;
  errorStackTrace?: ErrorStackTrace;
}

export interface ErrorDetailsProps {
  errorStackTrace?: ErrorStackTrace;
  variants?: Variants;
}

export interface ErrorCardProps {
  children: ReactNode;
}
