import {
  faChevronDown,
  faChevronUp,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';

import {
  AssistantBody,
  CollapsedLogItem,
  ConversationStack,
  FlowHeader,
  FlowMessageLabel,
  FlowToggleIcon,
  InlineSpinningIcon,
  LogDot,
  LogItem,
  LogList,
  LogTextContent,
  LogTextRow,
  MessageBubble,
  MessageLabel,
  MessageRow,
  MessageText,
  RetryWithAiButton,
  SuggestionButton,
  SuggestionList,
} from './AiBusinessSeeding.styles';

import type { ActionDefinition, ConversationTurn, LogEntry } from './types';

type AgentPhase =
  | 'idle'
  | 'analyzing'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'error';

interface CollapsibleFlowLogsProps {
  logs: LogEntry[];
  turnId: string;
  isActive: boolean;
}

const CollapsibleFlowLogs: React.FC<CollapsibleFlowLogsProps> = ({
  logs,
  turnId,
  isActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (logs.length === 0) return null;

  const lastLog = logs[logs.length - 1];

  return (
    <MessageBubble $variant="system">
      <FlowHeader onClick={() => setIsExpanded(!isExpanded)}>
        <FlowMessageLabel>Flujo</FlowMessageLabel>
        <FlowToggleIcon icon={isExpanded ? faChevronUp : faChevronDown} />
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
                <LogTextRow>
                  <LogTextContent>{entry.msg}</LogTextContent>
                  {isLastActive && <InlineSpinningIcon icon={faCircleNotch} />}
                </LogTextRow>
              </LogItem>
            );
          })
        ) : (
          <CollapsedLogItem
            key={`${turnId}-${lastLog.type}-last`}
            $type={lastLog.type}
          >
            <LogDot $type={lastLog.type} />
            <LogTextRow>
              <LogTextContent>{lastLog.msg}</LogTextContent>
              {isActive && <InlineSpinningIcon icon={faCircleNotch} />}
            </LogTextRow>
          </CollapsedLogItem>
        )}
      </LogList>
    </MessageBubble>
  );
};

interface RenderTurnContentParams {
  actionId: string | null;
  data: unknown | null;
  succeeded: boolean;
  turnIsTestMode: boolean;
  isCurrentTurn: boolean;
  actions: Record<string, ActionDefinition>;
  loading: boolean;
  onExecute: () => void | Promise<void>;
  onReset: () => void;
}

const renderTurnContent = ({
  actionId,
  data,
  succeeded,
  turnIsTestMode,
  isCurrentTurn,
  actions,
  loading,
  onExecute,
  onReset,
}: RenderTurnContentParams) => {
  if (!actionId) return null;
  const action = actions[actionId];
  if (!action) return null;
  const Preview = action.PreviewComponent;
  const Result = action.ResultComponent;

  if (succeeded && Result) {
    return <Result data={data} onReset={onReset} readonly={!isCurrentTurn} />;
  }

  if (Preview) {
    return (
      <Preview
        data={data}
        onExecute={isCurrentTurn ? onExecute : undefined}
        loading={isCurrentTurn ? loading : false}
        isTestMode={turnIsTestMode}
        readonly={!isCurrentTurn}
      />
    );
  }

  return null;
};

interface ConversationTurnViewProps {
  turn: ConversationTurn;
  actions: Record<string, ActionDefinition>;
  loading: boolean;
  agentPhase: AgentPhase;
  isCurrentTurn?: boolean;
  onApplyRecoverableSuggestion: (suggestion: string) => unknown;
  onAnalyze: (promptOverride?: unknown) => void | Promise<void>;
  onExecute: () => void | Promise<void>;
  onReset: () => void;
}

const ConversationTurnView: React.FC<ConversationTurnViewProps> = ({
  turn,
  actions,
  loading,
  agentPhase,
  isCurrentTurn = false,
  onApplyRecoverableSuggestion,
  onAnalyze,
  onExecute,
  onReset,
}) => {
  const turnContent = renderTurnContent({
    actionId: turn.actionId,
    data: turn.actionData,
    succeeded: turn.executionSuccess,
    turnIsTestMode: turn.isTestMode,
    isCurrentTurn,
    actions,
    loading,
    onExecute,
    onReset,
  });

  return (
    <ConversationStack>
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
            isActive={
              isCurrentTurn &&
              (agentPhase === 'analyzing' || agentPhase === 'executing')
            }
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
              <MessageText>
                {turn.recoverableError.clarificationQuestion ||
                  turn.recoverableError.message}
              </MessageText>

              {Array.isArray(turn.recoverableError.suggestions) &&
              turn.recoverableError.suggestions.length > 0 ? (
                <SuggestionList>
                  {turn.recoverableError.suggestions
                    .slice(0, 4)
                    .map((suggestion) => (
                      <SuggestionButton
                        key={`${turn.id}-suggestion-${suggestion}`}
                        size="sm"
                        variant="outline"
                        isDisabled={!isCurrentTurn || loading}
                        onPress={() => {
                          onApplyRecoverableSuggestion(suggestion);
                        }}
                      >
                        Aplicar {suggestion}
                      </SuggestionButton>
                    ))}
                </SuggestionList>
              ) : null}

              {isCurrentTurn && turn.recoverableError.suggestedUserPrompt ? (
                <div>
                  <RetryWithAiButton
                    size="sm"
                    variant="primary"
                    isPending={loading && agentPhase === 'analyzing'}
                    onPress={() =>
                      void onAnalyze(turn.recoverableError?.suggestedUserPrompt)
                    }
                  >
                    Corregir con IA y reintentar
                  </RetryWithAiButton>
                </div>
              ) : null}
            </AssistantBody>
          </MessageBubble>
        </MessageRow>
      ) : null}
    </ConversationStack>
  );
};

export default ConversationTurnView;
