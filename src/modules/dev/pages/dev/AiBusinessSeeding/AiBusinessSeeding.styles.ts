import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { VmButton, VmSurface } from '@/components/heroui';

import type { LogEntry } from './types';

export const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f7fe;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  overflow: hidden;
`;

export const Header = styled.header`
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
  z-index: 10;
`;

export const HeaderLeading = styled.div`
  justify-self: start;
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 18px;
  color: #333;
`;

export const BrandName = styled.span`
  color: var(--color-primary);
`;

export const EnvironmentBadge = styled.div<{ $tone: 'warning' | 'danger' }>`
  justify-self: end;
  min-width: 112px;
  border: 1px solid
    ${({ $tone }) => ($tone === 'danger' ? '#ffa39e' : '#ffe58f')};
  border-radius: 999px;
  background: ${({ $tone }) => ($tone === 'danger' ? '#fff1f0' : '#fffbe6')};
  color: ${({ $tone }) => ($tone === 'danger' ? '#a8071a' : '#ad6800')};
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  padding: 7px 11px;
  text-align: center;
`;

export const HeaderBadges = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const BadgeText = styled.span`
  display: block;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 3px;
`;

export const HeaderHomeButton = styled(VmButton)`
  min-width: 36px;
  color: #4b5563;
`;

export const Workspace = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

export const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

export const ScrollableChatContent = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 40px;
`;

export const ConversationStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const MessageRow = styled.div<{ $align?: 'left' | 'right' }>`
  display: flex;
  justify-content: ${({ $align }) =>
    $align === 'right' ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

export const MessageBubble = styled(VmSurface)<{
  $variant?: 'user' | 'assistant' | 'system';
}>`
  max-width: min(100%, 680px);
  padding: ${({ $variant }) =>
    $variant === 'system' ? '0.9rem 1rem' : '1rem 1.1rem'};
  border-radius: 18px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'user' ? 'rgb(42 120 255 / 30%)' : '#e8ecf3'};
  background: ${({ $variant }) =>
    $variant === 'user'
      ? 'linear-gradient(135deg, #2a78ff 0%, #1d5fda 100%)'
      : '#fff'};
  box-shadow: 0 8px 20px rgb(15 23 42 / 6%);
  color: ${({ $variant }) => ($variant === 'user' ? '#fff' : '#1f2937')};
`;

export const MessageLabel = styled.div`
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.72;
`;

export const FlowMessageLabel = styled(MessageLabel)`
  margin-bottom: 0;
`;

export const MessageText = styled.pre`
  margin: 0;
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.45;
`;

export const AssistantBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

export const SuggestionButton = styled(VmButton)`
  && {
    min-height: 36px;
    border-radius: 999px;
    height: auto;
    max-width: min(100%, 320px);
    padding: 0.45rem 0.8rem;
    background: #fff;
    border: 1px solid #d9e2f2;
    color: #253044;
    font-weight: 600;
    line-height: 1.2;
    justify-content: flex-start;
    white-space: normal;
    text-align: left;
    box-shadow: 0 4px 12px rgb(15 23 42 / 5%);

    &:hover,
    &:focus {
      border-color: #1f6feb;
      color: #0f5fd3;
      background: #f7fbff;
    }
  }
`;

export const RetryWithAiButton = styled(VmButton)`
  && {
    width: fit-content;
    min-height: 38px;
    height: auto;
    border-radius: 999px;
    padding: 0.5rem 0.85rem;
    font-weight: 700;
    box-shadow: 0 8px 18px rgb(31 111 235 / 18%);
  }
`;

export const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const LogItem = styled.div<{ $type: LogEntry['type'] }>`
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.55rem 0.65rem;
  border-radius: 12px;
  background: ${({ $type }) => {
    if ($type === 'error') return '#fff1f0';
    if ($type === 'warning') return '#fffbe6';
    if ($type === 'success') return '#f6ffed';
    return '#f7f9fc';
  }};
  color: #243041;
`;

export const CollapsedLogItem = styled(LogItem)`
  position: relative;
`;

export const LogDot = styled.span<{ $type: LogEntry['type'] }>`
  width: 8px;
  height: 8px;
  margin-top: 0.38rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: ${({ $type }) => {
    if ($type === 'error') return '#ff4d4f';
    if ($type === 'warning') return '#faad14';
    if ($type === 'success') return '#52c41a';
    return '#2a78ff';
  }};
`;

export const LogText = styled.div`
  font-size: 0.92rem;
  line-height: 1.35;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const LogTextRow = styled(LogText)`
  display: flex;
  width: 100%;
  align-items: center;
`;

export const LogTextContent = styled.span`
  flex: 1;
`;

export const FlowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  cursor: pointer;
  user-select: none;
  padding-bottom: 4px;
`;

export const FlowToggleIcon = styled(FontAwesomeIcon)`
  color: #8c8c8c;
  font-size: 12px;
  transition: transform 0.3s;
`;

export const SpinningIcon = styled(FontAwesomeIcon)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const InlineSpinningIcon = styled(SpinningIcon)`
  margin-left: 8px;
  color: #1890ff;
  font-size: 12px;
`;

export const ModalContentStack = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 8px;
`;
