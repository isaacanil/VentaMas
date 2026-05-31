import {
  faHome,
  faChevronDown,
  faChevronUp,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { App as AntApp, Input, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { VmButton, VmSurface } from '@/components/heroui';

import { useAiChat } from './hooks/useAiChat';
import AssistantSettingsModal from './components/AssistantSettingsModal';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';
import {
  getAiBusinessSeedingExecutionSessionToken,
  getAiBusinessSeedingTargetSession,
  hasActiveAiBusinessSeedingTargetAuthSession,
  loginAiBusinessSeedingTarget,
} from './api/aiBusinessSeedingTargetSession';
import {
  getAiBusinessSeedingEnvironmentById,
  getCurrentAiBusinessSeedingEnvironment,
} from './utils/environment';
import {
  getStoredAiBusinessSeedingTargetEnvironmentId,
  storeAiBusinessSeedingTargetEnvironmentId,
} from './utils/targetEnvironmentPreference';

import type { ActionDefinition, ConversationTurn, LogEntry } from './types';
import type { AiBusinessSeedingEnvironmentId } from './utils/environment';

const { Text } = Typography;

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

const EnvironmentBadge = styled.div<{ $tone: 'warning' | 'danger' }>`
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

const HeaderBadges = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const BadgeText = styled.span`
  display: block;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 3px;
`;

const HeaderHomeButton = styled(VmButton)`
  min-width: 36px;
  color: #4b5563;
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

const MessageBubble = styled(VmSurface)<{
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
  gap: 0.9rem;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const SuggestionButton = styled(VmButton)`
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

const RetryWithAiButton = styled(VmButton)`
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
                <LogText
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ flex: 1 }}>{entry.msg}</span>
                  {isLastActive && (
                    <SpinningIcon
                      icon={faCircleNotch}
                      style={{
                        marginLeft: '8px',
                        color: '#1890ff',
                        fontSize: '12px',
                      }}
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
            <LogText
              style={{ display: 'flex', width: '100%', alignItems: 'center' }}
            >
              <span style={{ flex: 1 }}>{lastLog.msg}</span>
              {isActive && (
                <SpinningIcon
                  icon={faCircleNotch}
                  style={{
                    marginLeft: '8px',
                    color: '#1890ff',
                    fontSize: '12px',
                  }}
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
  const { message: messageApi } = AntApp.useApp();
  const currentEnvironment = getCurrentAiBusinessSeedingEnvironment();
  const [targetEnvironmentId, setTargetEnvironmentId] =
    useState<AiBusinessSeedingEnvironmentId>(() =>
      getStoredAiBusinessSeedingTargetEnvironmentId(currentEnvironment.id),
    );
  const targetEnvironment =
    getAiBusinessSeedingEnvironmentById(targetEnvironmentId);
  const [, setTargetSessionVersion] = useState(0);
  const [targetLoginOpen, setTargetLoginOpen] = useState(false);
  const [targetLoginEnvironmentId, setTargetLoginEnvironmentId] =
    useState<AiBusinessSeedingEnvironmentId>('production');
  const [targetLoginUsername, setTargetLoginUsername] = useState('');
  const [targetLoginPassword, setTargetLoginPassword] = useState('');
  const [targetLoginLoading, setTargetLoginLoading] = useState(false);
  const [productionConfirmOpen, setProductionConfirmOpen] = useState(false);
  const [productionConfirmText, setProductionConfirmText] = useState('');
  const [assistantSettingsOpen, setAssistantSettingsOpen] = useState(false);

  const productionTargetSession =
    getAiBusinessSeedingTargetSession('production');
  const isProductionTargetConnected = Boolean(productionTargetSession);
  const productionTargetLabel =
    productionTargetSession?.displayName || productionTargetSession?.username;

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
    handleCheckStatus,
    handleClear,
    handleApplyRecoverableSuggestion,
    handleAnalyze,
    handleExecute,
  } = useAiChat();

  const handleOpenTargetLogin = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    if (environmentId === currentEnvironment.id) {
      messageApi.info(`${currentEnvironment.label} ya usa la sesion actual.`);
      return;
    }

    setTargetLoginEnvironmentId(environmentId);
    setTargetLoginPassword('');
    setTargetLoginOpen(true);
  };

  const setPersistentTargetEnvironmentId = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    setTargetEnvironmentId(environmentId);
    storeAiBusinessSeedingTargetEnvironmentId(environmentId);
  };

  const handleSubmitTargetLogin = async () => {
    const username = targetLoginUsername.trim();
    if (!username || !targetLoginPassword) {
      messageApi.warning('Usuario y contrasena requeridos.');
      return;
    }

    setTargetLoginLoading(true);
    try {
      const session = await loginAiBusinessSeedingTarget({
        environmentId: targetLoginEnvironmentId,
        username,
        password: targetLoginPassword,
      });
      setTargetSessionVersion((version) => version + 1);
      setPersistentTargetEnvironmentId(targetLoginEnvironmentId);
      setTargetLoginOpen(false);
      setTargetLoginPassword('');
      messageApi.success(
        `Conectado a ${
          getAiBusinessSeedingEnvironmentById(targetLoginEnvironmentId).label
        } como ${session.displayName || session.username || username}.`,
      );
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar el destino.',
      );
    } finally {
      setTargetLoginLoading(false);
    }
  };

  const executeAgainstSelectedTarget = async () => {
    const sessionToken = getAiBusinessSeedingExecutionSessionToken(
      targetEnvironment.id,
    );

    await handleExecute({
      targetEnvironmentId: targetEnvironment.id,
      targetLabel: targetEnvironment.label,
      sessionToken,
    });
  };

  const handleExecuteWithTarget = async () => {
    if (targetEnvironment.id === 'production') {
      const session = getAiBusinessSeedingTargetSession(targetEnvironment.id);
      const hasTargetSession =
        await hasActiveAiBusinessSeedingTargetAuthSession(
          targetEnvironment.id,
          session,
        );

      if (!hasTargetSession) {
        messageApi.warning(
          'Conecta una sesion de produccion antes de ejecutar en produccion.',
        );
        handleOpenTargetLogin(targetEnvironment.id);
        return;
      }

      if (!isTestMode) {
        setProductionConfirmText('');
        setProductionConfirmOpen(true);
        return;
      }
    }

    await executeAgainstSelectedTarget();
  };

  const handleConfirmProductionExecute = async () => {
    if (productionConfirmText.trim() !== 'PRODUCCION') return;
    setProductionConfirmOpen(false);
    setProductionConfirmText('');
    await executeAgainstSelectedTarget();
  };

  const handleSelectTargetEnvironment = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    if (environmentId === targetEnvironment.id) return;

    const nextEnvironment = getAiBusinessSeedingEnvironmentById(environmentId);
    if (nextEnvironment.id === 'production') {
      Modal.confirm({
        title: 'Usar produccion como destino',
        content:
          'La pantalla seguira en staging, pero la ejecucion de creacion llamara las Cloud Functions de produccion. Manten modo prueba hasta validar el borrador.',
        okText: 'Usar produccion',
        cancelText: 'Cancelar',
        okButtonProps: { danger: true },
        onOk: () => {
          setPersistentTargetEnvironmentId(nextEnvironment.id);
          setIsTestMode(true);
          if (!getAiBusinessSeedingTargetSession(nextEnvironment.id)) {
            handleOpenTargetLogin(nextEnvironment.id);
          }
        },
      });
      return;
    }

    setPersistentTargetEnvironmentId(nextEnvironment.id);
  };

  const handleToggleProductionTargetFromSettings = (isEnabled: boolean) => {
    const nextEnvironmentId: AiBusinessSeedingEnvironmentId = isEnabled
      ? 'production'
      : currentEnvironment.id;

    if (nextEnvironmentId === targetEnvironment.id) return;

    if (isEnabled) {
      setAssistantSettingsOpen(false);
    }

    handleSelectTargetEnvironment(nextEnvironmentId);
  };

  const handleConnectProductionFromSettings = () => {
    setAssistantSettingsOpen(false);
    handleOpenTargetLogin('production');
  };

  const handleCheckStatusFromSettings = () => {
    setAssistantSettingsOpen(false);
    handleCheckStatus();
  };

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
        <Result data={data} onReset={handleClear} readonly={!isCurrentTurn} />
      );
    }

    if (Preview) {
      return (
        <Preview
          data={data}
          onExecute={isCurrentTurn ? handleExecuteWithTarget : undefined}
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
                <MessageText style={{ margin: 0 }}>
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
                    <RetryWithAiButton
                      size="sm"
                      variant="primary"
                      isPending={loading && agentPhase === 'analyzing'}
                      onPress={() =>
                        void handleAnalyze(
                          turn.recoverableError?.suggestedUserPrompt,
                        )
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
          <HeaderHomeButton
            aria-label="Volver a inicio"
            isIconOnly
            size="sm"
            variant="tertiary"
            onPress={() => navigate('/home')}
          >
            <FontAwesomeIcon icon={faHome} />
          </HeaderHomeButton>
        </div>
        <HeaderTitle>
          <span style={{ color: 'var(--color-primary)' }}>Ventamax</span>
        </HeaderTitle>
        <HeaderBadges>
          <EnvironmentBadge $tone={targetEnvironment.tone}>
            <BadgeText>Destino</BadgeText>
            {targetEnvironment.label}
          </EnvironmentBadge>
        </HeaderBadges>
      </Header>

      <Workspace>
        <ChatColumn>
          <ScrollableChatContent>
            <ContentWrapper>
              {!hasConversation && <EmptyState />}

              {hasConversation && (
                <>
                  {historyTurns.map((turn) => renderConversationTurn(turn))}
                  {currentTurn &&
                    renderConversationTurn(currentTurn, {
                      isCurrentTurn: true,
                    })}
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
            onOpenSettings={() => setAssistantSettingsOpen(true)}
            onClear={handleClear}
            targetEnvironment={targetEnvironment}
            canClear={hasConversation || Boolean(prompt.trim())}
          />
        </ChatColumn>
      </Workspace>

      <AssistantSettingsModal
        isOpen={assistantSettingsOpen}
        isProductionTargetEnabled={targetEnvironment.id === 'production'}
        isProductionTargetConnected={isProductionTargetConnected}
        loading={loading}
        productionTargetLabel={productionTargetLabel}
        onCheckStatus={handleCheckStatusFromSettings}
        onConnectProduction={handleConnectProductionFromSettings}
        onOpenChange={setAssistantSettingsOpen}
        onToggleProductionTarget={handleToggleProductionTargetFromSettings}
      />

      <Modal
        title={`Conectar ${
          getAiBusinessSeedingEnvironmentById(targetLoginEnvironmentId).label
        }`}
        open={targetLoginOpen}
        okText="Conectar"
        cancelText="Cancelar"
        confirmLoading={targetLoginLoading}
        onOk={() => void handleSubmitTargetLogin()}
        onCancel={() => {
          if (!targetLoginLoading) {
            setTargetLoginOpen(false);
            setTargetLoginPassword('');
          }
        }}
      >
        <div style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
          <Text type="secondary">
            Esta sesion se guarda aparte para el asistente y no reemplaza tu
            sesion principal de staging.
          </Text>
          <Input
            autoFocus
            placeholder="Usuario de produccion"
            value={targetLoginUsername}
            onChange={(event) => setTargetLoginUsername(event.target.value)}
            onPressEnter={() => void handleSubmitTargetLogin()}
          />
          <Input.Password
            placeholder="Contrasena"
            value={targetLoginPassword}
            onChange={(event) => setTargetLoginPassword(event.target.value)}
            onPressEnter={() => void handleSubmitTargetLogin()}
          />
        </div>
      </Modal>

      <Modal
        title="Confirmar ejecucion en produccion"
        open={productionConfirmOpen}
        okText="Crear en produccion"
        cancelText="Cancelar"
        okButtonProps={{
          danger: true,
          disabled: productionConfirmText.trim() !== 'PRODUCCION',
        }}
        onOk={() => void handleConfirmProductionExecute()}
        onCancel={() => {
          setProductionConfirmOpen(false);
          setProductionConfirmText('');
        }}
      >
        <div style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
          <Text type="danger">
            Esta accion creara datos reales en produccion. Verifica el preview,
            el usuario owner y los correos antes de continuar.
          </Text>
          <Text type="secondary">Escribe PRODUCCION para confirmar.</Text>
          <Input
            value={productionConfirmText}
            onChange={(event) => setProductionConfirmText(event.target.value)}
            onPressEnter={() => void handleConfirmProductionExecute()}
          />
        </div>
      </Modal>
    </AppContainer>
  );
};

export default AiBusinessSeeding;
