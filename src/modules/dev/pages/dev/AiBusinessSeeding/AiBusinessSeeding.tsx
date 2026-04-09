import {
  faHome,
  faChevronDown,
  faChevronUp,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useAiChat } from './hooks/useAiChat';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';

import type {
  ActionDefinition,
  ConversationTurn,
  LogEntry,
} from './types';

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f7fe;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  overflow: hidden;
`;

const Header = styled.header`
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

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 18px;
  color: #333;
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const ScrollableChatContent = styled.main`
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

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 40px;
`;

const ConversationStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const MessageRow = styled.div<{ $align?: 'left' | 'right' }>`
  display: flex;
  justify-content: ${({ $align }) =>
    $align === 'right' ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const MessageBubble = styled.div<{
  $variant?: 'user' | 'assistant' | 'system';
}>`
  max-width: min(100%, 680px);
  padding: ${({ $variant }) =>
    $variant === 'system' ? '0.9rem 1rem' : '1rem 1.1rem'};
  border-radius: 18px;
  border: 1px solid
    ${({ $variant }) =>
    $variant === 'user' ? 'rgb(42 120 255 / 30%)' : '#e8ecf3'};
  background:
    ${({ $variant }) =>
    $variant === 'user'
      ? 'linear-gradient(135deg, #2a78ff 0%, #1d5fda 100%)'
      : '#fff'};
  box-shadow: 0 8px 20px rgb(15 23 42 / 6%);
  color: ${({ $variant }) => ($variant === 'user' ? '#fff' : '#1f2937')};
`;

const MessageLabel = styled.div`
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.72;
`;

const MessageText = styled.pre`
  margin: 0;
  font: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
`;

const AssistantBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SuggestionButton = styled(Button)`
  && {
    border-radius: 999px;
    height: auto;
    padding: 0.35rem 0.7rem;
  }
`;

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LogItem = styled.div<{ $type: LogEntry['type'] }>`
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

const LogDot = styled.span<{ $type: LogEntry['type'] }>`
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

const LogText = styled.div`
  font-size: 0.92rem;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
`;

const FlowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  cursor: pointer;
  user-select: none;
  padding-bottom: 4px;
`;

const SpinningIcon = styled(FontAwesomeIcon)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

const CollapsibleFlowLogs: React.FC<{
  logs: LogEntry[];
  turnId: string;
  isActive: boolean;
}> = ({ logs, turnId, isActive }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (logs.length === 0) return null;

  const lastLog = logs[logs.length - 1];

  return (
    <MessageBubble $variant="system">
      <FlowHeader onClick={() => setIsExpanded(!isExpanded)}>
        <MessageLabel style={{ marginBottom: 0 }}>Flujo</MessageLabel>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          style={{
            color: '#8c8c8c',
            fontSize: '12px',
            transition: 'transform 0.3s',
          }}
        />
      </FlowHeader>

      <LogList>
        {isExpanded ? (
          logs.map((entry, idx) => {
            const isLastActive = isActive && idx === logs.length - 1;
            return (
              <LogItem
                key={`${turnId}-${entry.type}-${entry.msg}`}
                $type={entry.type}
              >
                <LogDot $type={entry.type} />
                <LogText style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <span style={{ flex: 1 }}>{entry.msg}</span>
                  {isLastActive && (
                    <SpinningIcon
                      icon={faCircleNotch}
                      style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}
                    />
                  )}
                </LogText>
              </LogItem>
            );
          })
        ) : (
          <LogItem
            key={`${turnId}-${lastLog.type}-last`}
            $type={lastLog.type}
            style={{ position: 'relative' }}
          >
            <LogDot $type={lastLog.type} />
            <LogText style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{lastLog.msg}</span>
              {isActive && (
                <SpinningIcon
                  icon={faCircleNotch}
                  style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}
                />
              )}
            </LogText>
          </LogItem>
        )}
      </LogList>
    </MessageBubble>
  );
};

const AiBusinessSeeding: React.FC = () => {
  const navigate = useNavigate();
  const {
    actions,
    prompt,
    setPrompt,
    loading,
    activeAction,
    actionData,
    logs,
    lastUserMessage,
    historyTurns,
    lastRecoverableError,
    isTestMode,
    setIsTestMode,
    enabledActions,
    executionSuccess,
    agentPhase,
    contentEndRef,
    handleToggleAction,
    handleClear,
    handleApplyRecoverableSuggestion,
    handleAnalyze,
    handleExecute,
  } = useAiChat();

  const renderTurnContent = ({
    actionId,
    data,
    succeeded,
    turnIsTestMode,
    isCurrentTurn,
  }: {
    actionId: string | null;
    data: unknown | null;
    succeeded: boolean;
    turnIsTestMode: boolean;
    isCurrentTurn: boolean;
  }) => {
    if (!actionId) return null;
    const action = (actions as Record<string, ActionDefinition>)[actionId];
    if (!action) return null;
    const Preview = action.PreviewComponent;
    const Result = action.ResultComponent;

    if (succeeded && Result) {
      return (
        <Result
          data={data}
          onReset={handleClear}
          readonly={!isCurrentTurn}
        />
      );
    }

    if (Preview) {
      return (
        <Preview
          data={data}
          onExecute={isCurrentTurn ? handleExecute : undefined}
          loading={isCurrentTurn ? loading : false}
          isTestMode={turnIsTestMode}
          readonly={!isCurrentTurn}
        />
      );
    }

    return null;
  };
  const renderConversationTurn = (
    turn: ConversationTurn,
    { isCurrentTurn = false }: { isCurrentTurn?: boolean } = {},
  ) => {
    const turnContent = renderTurnContent({
      actionId: turn.actionId,
      data: turn.actionData,
      succeeded: turn.executionSuccess,
      turnIsTestMode: turn.isTestMode,
      isCurrentTurn,
    });

    return (
      <ConversationStack key={turn.id}>
        {turn.userMessage ? (
          <MessageRow $align="right">
            <MessageBubble $variant="user">
              <MessageLabel>Tú</MessageLabel>
              <MessageText>{turn.userMessage}</MessageText>
            </MessageBubble>
          </MessageRow>
        ) : null}

        {turn.logs.length > 0 && turn.actionId !== 'chat' ? (
          <MessageRow>
            <CollapsibleFlowLogs
              logs={turn.logs}
              turnId={turn.id}
              isActive={isCurrentTurn && (agentPhase === 'analyzing' || agentPhase === 'executing')}
            />
          </MessageRow>
        ) : null}

        {turn.actionId ? (
          <MessageRow>
            <MessageBubble $variant="assistant">
              {turn.actionId !== 'chat' && (
                <MessageLabel>
                  {turn.executionSuccess ? 'Resultado' : 'Confirmación'}
                </MessageLabel>
              )}
              {turnContent}
            </MessageBubble>
          </MessageRow>
        ) : null}

        {turn.recoverableError ? (
          <MessageRow>
            <MessageBubble $variant="assistant">
              <MessageLabel>Aclaración del Agente</MessageLabel>
              <AssistantBody>
                <MessageText style={{ margin: 0 }}>
                  {turn.recoverableError.clarificationQuestion ||
                    turn.recoverableError.message}
                </MessageText>

                {Array.isArray(turn.recoverableError.suggestions) &&
                turn.recoverableError.suggestions.length > 0 ? (
                  <SuggestionList>
                    {turn.recoverableError.suggestions.slice(0, 4).map((suggestion) => (
                      <SuggestionButton
                        key={`${turn.id}-suggestion-${suggestion}`}
                        size="small"
                        disabled={!isCurrentTurn || loading}
                        onClick={() => {
                          handleApplyRecoverableSuggestion(suggestion);
                        }}
                      >
                        Aplicar {suggestion}
                      </SuggestionButton>
                    ))}
                  </SuggestionList>
                ) : null}

                {isCurrentTurn && turn.recoverableError.suggestedUserPrompt ? (
                  <div>
                    <Button
                      type="primary"
                      size="small"
                      loading={loading && agentPhase === 'analyzing'}
                      onClick={() =>
                        void handleAnalyze(turn.recoverableError?.suggestedUserPrompt)
                      }
                    >
                      Corregir con IA y reintentar
                    </Button>
                  </div>
                ) : null}
              </AssistantBody>
            </MessageBubble>
          </MessageRow>
        ) : null}
      </ConversationStack>
    );
  };

  const hasConversation =
    historyTurns.length > 0 ||
    Boolean(lastUserMessage) ||
    logs.length > 0 ||
    Boolean(activeAction);

  const currentTurn: ConversationTurn | null =
    Boolean(lastUserMessage) || logs.length > 0 || Boolean(activeAction)
      ? {
        id: 'current-turn',
        userMessage: lastUserMessage,
        logs,
        actionId: activeAction,
        actionData,
        executionSuccess,
        isTestMode,
        recoverableError: lastRecoverableError,
      }
      : null;

  return (
    <AppContainer>
      <Header>
        <div style={{ justifySelf: 'start' }}>
          <Button
            onClick={() => navigate('/home')}
            icon={<FontAwesomeIcon icon={faHome} />}
          />
        </div>
        <HeaderTitle>
          <span style={{ color: 'var(--color-primary)' }}>Ventamax</span>
        </HeaderTitle>
        <div />
      </Header>

      <Workspace>
        <ChatColumn>
          <ScrollableChatContent>
            <ContentWrapper>
              {!hasConversation && <EmptyState />}

              {hasConversation && (
                <>
                  {historyTurns.map((turn) => renderConversationTurn(turn))}
                  {currentTurn && renderConversationTurn(currentTurn, { isCurrentTurn: true })}
                </>
              )}

              <div ref={contentEndRef} />
            </ContentWrapper>
          </ScrollableChatContent>

          <ChatInput
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            isTestMode={isTestMode}
            setIsTestMode={setIsTestMode}
            actions={actions}
            enabledActions={enabledActions}
            onToggleAction={handleToggleAction}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            canClear={hasConversation || Boolean(prompt.trim())}
          />
        </ChatColumn>
      </Workspace>
    </AppContainer>
  );
};

export default AiBusinessSeeding;
