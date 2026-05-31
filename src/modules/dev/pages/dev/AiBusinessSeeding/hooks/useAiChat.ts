import { useEffect, useRef, useState } from 'react';

import { App as AntApp } from 'antd';
import { nanoid } from 'nanoid';

import { ACTIONS } from '../aiActions';
import { fbAiBusinessSeedingAgentAnalyze } from '../api/fbAiBusinessSeedingAgentAnalyze';
import { fbAiBusinessSeedingAgentExecute } from '../api/fbAiBusinessSeedingAgentExecute';
import { fbAiBusinessSeedingAgentStatus } from '../api/fbAiBusinessSeedingAgentStatus';
import { buildAgentConversationContext } from '../utils/conversationContext';
import { formatRuntime, formatStatusDetails } from '../utils/runtimeMetadata';

import type {
  ActionDefinition,
  AgentRecoverableError,
  ConversationTurn,
  LogEntry,
  LogType,
} from '../types';
import type { AiBusinessSeedingEnvironmentId } from '../utils/environment';

type AgentPhase =
  | 'idle'
  | 'analyzing'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'error';

interface ExecuteOptions {
  targetEnvironmentId?: AiBusinessSeedingEnvironmentId;
  targetLabel?: string;
  sessionToken?: string | null;
}

export function useAiChat() {
  const { message: messageApi } = AntApp.useApp();
  const actions: Record<string, ActionDefinition> = ACTIONS;
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<unknown | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [historyTurns, setHistoryTurns] = useState<ConversationTurn[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [enabledActions, setEnabledActions] = useState<string[]>(() =>
    Object.keys(ACTIONS),
  );
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [lastRecoverableError, setLastRecoverableError] =
    useState<AgentRecoverableError | null>(null);

  const showCanvas =
    Boolean(activeAction) && activeAction !== 'chat' && Boolean(actionData);

  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const turnSequenceRef = useRef(0);
  const executeRequestIdRef = useRef<string | null>(null);

  const buildLogEntry = (msg: string, type: LogType = 'info'): LogEntry => ({
    msg: `[${new Date().toLocaleTimeString()}] ${msg}`,
    type,
  });

  const addLog = (msg: string, type: LogType = 'info') => {
    setLogs((prev) => [...prev, buildLogEntry(msg, type)]);
  };

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
      const details = (error as { details?: unknown }).details;
      const diagnostic =
        details && typeof details === 'object'
          ? (details as { diagnostic?: unknown }).diagnostic
          : null;

      if (diagnostic && typeof diagnostic === 'object') {
        const diagnosticData = diagnostic as {
          category?: unknown;
          message?: unknown;
          model?: unknown;
          location?: unknown;
        };
        const message =
          typeof diagnosticData.message === 'string'
            ? diagnosticData.message
            : '';
        const category =
          typeof diagnosticData.category === 'string'
            ? diagnosticData.category
            : 'AI_DIAGNOSTIC';
        const model =
          typeof diagnosticData.model === 'string' ? diagnosticData.model : '';
        const location =
          typeof diagnosticData.location === 'string'
            ? diagnosticData.location
            : '';
        const runtime =
          model || location
            ? ` (${[model, location].filter(Boolean).join(' @ ')})`
            : '';

        return `${category}${runtime}: ${message || 'Error diagnosticado por la function'}`;
      }
    }

    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Error inesperado';
  };

  const isDeadlineExceededError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as { code?: unknown; message?: unknown };
    const code =
      typeof candidate.code === 'string' ? candidate.code.toLowerCase() : '';
    const messageText =
      typeof candidate.message === 'string'
        ? candidate.message.toLowerCase()
        : '';

    return (
      code.includes('deadline-exceeded') ||
      messageText.includes('deadline-exceeded')
    );
  };

  const cloneJsonLike = <T>(value: T): T => {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  };

  const parseRecoverableField = (field?: string) => {
    const match =
      typeof field === 'string'
        ? field.match(/^users\[(\d+)\]\.(name|email)$/)
        : null;
    if (!match) return null;

    const index = Number(match[1]);
    const key = match[2] as 'name' | 'email';
    if (!Number.isInteger(index) || index < 0) return null;

    return { index, key };
  };

  useEffect(() => {
    if (
      activeAction ||
      executionSuccess ||
      logs.length > 0 ||
      historyTurns.length > 0
    ) {
      contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAction, executionSuccess, logs.length, historyTurns.length]);

  const hasActiveConversationState =
    Boolean(lastUserMessage) || logs.length > 0 || Boolean(activeAction);

  const archiveCurrentTurn = () => {
    if (!hasActiveConversationState) return;

    turnSequenceRef.current += 1;
    const nextTurn: ConversationTurn = {
      id: `turn-${turnSequenceRef.current}`,
      userMessage: lastUserMessage,
      logs: [...logs],
      actionId: activeAction,
      actionData,
      executionSuccess,
      isTestMode,
      recoverableError: lastRecoverableError,
    };

    setHistoryTurns((prev) => [...prev, nextTurn]);
  };

  const appendSystemLogTurn = (entries: LogEntry[]) => {
    turnSequenceRef.current += 1;
    const nextTurn: ConversationTurn = {
      id: `system-${turnSequenceRef.current}`,
      userMessage: '',
      logs: entries,
      actionId: null,
      actionData: null,
      executionSuccess: false,
      isTestMode,
      recoverableError: null,
    };

    setHistoryTurns((prev) => [...prev, nextTurn]);
  };

  const handleToggleAction = (actionId: string) => {
    setEnabledActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId],
    );
  };

  const handleClear = () => {
    executeRequestIdRef.current = null;
    setPrompt('');
    setActiveAction(null);
    setActionData(null);
    setExecutionSuccess(false);
    setLogs([]);
    setLastUserMessage('');
    setHistoryTurns([]);
    setAgentPhase('idle');
    setLastRecoverableError(null);
  };

  const handleCheckStatus = async () => {
    if (loading) return;

    setLoading(true);
    const diagnosticLogs = [
      buildLogEntry('Verificando diagnostico del asistente...', 'info'),
    ];

    try {
      const statusResponse = await fbAiBusinessSeedingAgentStatus();
      const metadata = statusResponse.metadata;
      if (!statusResponse.ok || !metadata) {
        throw new Error('Diagnostico del asistente no disponible.');
      }

      const details = formatStatusDetails(metadata);

      diagnosticLogs.push(
        buildLogEntry(
          `Diagnostico del asistente OK${details ? ` (${details})` : ''}.`,
          'success',
        ),
      );
    } catch (error: unknown) {
      console.error(error);
      diagnosticLogs.push(
        buildLogEntry(
          `Diagnostico fallido: ${getErrorMessage(error)}`,
          'error',
        ),
      );
      messageApi.error('No se pudo verificar el asistente');
    } finally {
      appendSystemLogTurn(diagnosticLogs);
      setLoading(false);
    }
  };

  const handleApplyRecoverableSuggestion = (suggestion: string) => {
    const recoverable = lastRecoverableError;
    if (!recoverable) {
      messageApi.warning('No hay una corrección pendiente para aplicar.');
      return false;
    }

    if (!activeAction || actionData == null) {
      messageApi.warning('No hay borrador activo para corregir.');
      return false;
    }

    const parsedField = parseRecoverableField(recoverable.field);
    if (!parsedField) {
      messageApi.info(
        'Esta corrección requiere IA. Usa "Corregir con IA y reintentar".',
      );
      return false;
    }

    const normalizedSuggestion = suggestion.trim();
    if (!normalizedSuggestion) return false;

    const cloned = cloneJsonLike(actionData);
    if (!cloned || typeof cloned !== 'object' || Array.isArray(cloned)) {
      messageApi.error('No se pudo aplicar la sugerencia al borrador actual.');
      return false;
    }

    const nextData = cloned as Record<string, unknown>;
    const users = Array.isArray(nextData.users) ? nextData.users : null;
    const targetUser = users?.[parsedField.index];
    if (
      !users ||
      !targetUser ||
      typeof targetUser !== 'object' ||
      Array.isArray(targetUser)
    ) {
      messageApi.error('No se encontró el usuario a corregir en el borrador.');
      return false;
    }

    users[parsedField.index] = {
      ...(targetUser as Record<string, unknown>),
      [parsedField.key]: normalizedSuggestion,
    };

    nextData.users = users;

    executeRequestIdRef.current = activeAction === 'chat' ? null : nanoid(21);
    setActionData(nextData);
    setExecutionSuccess(false);
    setAgentPhase('ready');
    setLastRecoverableError(null);
    setPrompt('');
    addLog(
      `Sugerencia aplicada sin IA: ${parsedField.key} -> ${normalizedSuggestion}. Revisa el preview y ejecuta nuevamente.`,
      'success',
    );
    messageApi.success('Sugerencia aplicada al borrador.');
    return true;
  };

  const handleAnalyze = async (promptOverride?: unknown) => {
    const promptSource =
      typeof promptOverride === 'string' ? promptOverride : prompt;
    const submittedPrompt = promptSource.trim();
    if (!submittedPrompt) {
      messageApi.error('Escribe algo primero');
      return;
    }

    const conversationContext = buildAgentConversationContext({
      activeAction,
      actionData,
      executionSuccess,
      historyTurns,
      lastRecoverableError,
      lastUserMessage,
    });
    archiveCurrentTurn();
    setLoading(true);
    setAgentPhase('analyzing');
    setLastRecoverableError(null);
    setExecutionSuccess(false);
    executeRequestIdRef.current = null;
    setActiveAction(null);
    setActionData(null);
    setLogs([]);
    setLastUserMessage(submittedPrompt);
    addLog('Analizando...', 'info');

    try {
      const analyzeResponse = await fbAiBusinessSeedingAgentAnalyze({
        prompt: submittedPrompt,
        enabledActions,
        conversationContext,
      });

      if (!analyzeResponse?.ok || !analyzeResponse.action) {
        addLog('No se detectó una acción válida', 'error');
        setAgentPhase('error');
        messageApi.error('No entendí la solicitud');
        setLoading(false);
        return;
      }

      if (analyzeResponse.metadata?.structuredOutput) {
        const details = formatRuntime(analyzeResponse.metadata);
        const outputMode = analyzeResponse.metadata.constrainedOutput
          ? 'salida estructurada schema-constrained'
          : 'salida estructurada activa';
        addLog(
          `Asistente 2.0: ${outputMode}${details ? ` (${details})` : ''}.`,
          'info',
        );
      }

      if (analyzeResponse.metadata?.requestMetrics?.contextTruncated) {
        addLog(
          'El contexto de conversacion fue truncado antes de enviarse al modelo.',
          'warning',
        );
      }

      try {
        const actionId =
          typeof analyzeResponse.action === 'string'
            ? analyzeResponse.action
            : null;
        const data = analyzeResponse.data ?? null;

        if (actionId && actions[actionId]) {
          executeRequestIdRef.current = actionId === 'chat' ? null : nanoid(21);
          setActiveAction(actionId);
          setActionData(data);
          setPrompt('');
          setAgentPhase('ready');
          if (actionId !== 'chat') {
            setLastRecoverableError(null);
          }
          addLog(`Acción detectada: ${actions[actionId].name}`, 'success');
        } else {
          setAgentPhase('error');
          addLog(`Acción desconocida: ${actionId ?? 'sin acción'}`, 'warning');
        }
      } catch (e) {
        console.error(e);
        setAgentPhase('error');
        addLog('Error parseando respuesta', 'error');
      }
    } catch (error: unknown) {
      console.error(error);
      setAgentPhase('error');
      if (isDeadlineExceededError(error)) {
        addLog(
          'La IA tardó demasiado en responder. Intenta de nuevo con una solicitud más corta o vuelve a intentar en unos segundos.',
          'warning',
        );
        messageApi.warning(
          'La IA tardó demasiado en responder. Intenta nuevamente.',
        );
        return;
      }
      const msg = getErrorMessage(error).replace(/^Error:\s*/i, '');
      addLog(`Error: ${msg}`, 'error');
      messageApi.error('Error al analizar');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (options: ExecuteOptions = {}) => {
    if (!activeAction || !actionData) return;

    const action = actions[activeAction];
    if (!action) {
      addLog('Acción no ejecutable', 'warning');
      return;
    }

    setLoading(true);
    setAgentPhase('executing');
    setLastRecoverableError(null);
    if (activeAction !== 'chat' && !executeRequestIdRef.current) {
      executeRequestIdRef.current = nanoid(21);
    }
    if (options.targetLabel && activeAction !== 'chat') {
      addLog(
        `Destino de creacion: ${options.targetLabel}${
          isTestMode ? ' (modo prueba)' : ''
        }`,
        options.targetEnvironmentId === 'production' ? 'warning' : 'info',
      );
    }
    addLog(`Ejecutando: ${action.name}`, 'info');

    try {
      const executionResponse = await fbAiBusinessSeedingAgentExecute({
        actionId: activeAction,
        actionData,
        isTestMode,
        executeRequestId: executeRequestIdRef.current,
        targetEnvironmentId: options.targetEnvironmentId,
        sessionToken: options.sessionToken,
      });

      if (Array.isArray(executionResponse.logs)) {
        executionResponse.logs.forEach((entry) => {
          if (!entry?.msg) return;
          addLog(entry.msg, entry.type || 'info');
        });
      }

      if (executionResponse?.ok === false && executionResponse.error) {
        const recoverable = executionResponse.error;
        setActionData(
          executionResponse.data !== undefined
            ? executionResponse.data
            : actionData,
        );
        setLastRecoverableError(recoverable);
        setAgentPhase('error');
        if (!prompt.trim() && recoverable.suggestedUserPrompt) {
          setPrompt(recoverable.suggestedUserPrompt);
        }

        messageApi.warning(
          recoverable.clarificationQuestion ||
            recoverable.message ||
            'Necesito una aclaración para continuar.',
        );
        return;
      }

      if (!executionResponse?.ok) {
        throw new Error('El agente no pudo ejecutar la acción solicitada.');
      }

      setActionData(
        executionResponse.data !== undefined
          ? executionResponse.data
          : actionData,
      );
      setExecutionSuccess(true);
      setAgentPhase('completed');
      setLastRecoverableError(null);
      addLog('Finalizado', 'success');
      messageApi.success('Listo!');
    } catch (error: unknown) {
      console.error(error);
      setAgentPhase('error');
      if (isDeadlineExceededError(error)) {
        addLog(
          'La ejecución tardó más de lo esperado. Verifica si el negocio ya se creó antes de reintentar para evitar duplicados.',
          'warning',
        );
        messageApi.warning(
          'La ejecución tardó demasiado. Verifica si se creó el negocio antes de reintentar.',
        );
        return;
      }
      addLog(
        `Error: ${getErrorMessage(error).replace(/^Error:\s*/i, '')}`,
        'error',
      );
      messageApi.error('Falló la ejecución');
    } finally {
      setLoading(false);
    }
  };

  return {
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
    showCanvas,
    contentEndRef,
    handleToggleAction,
    handleCheckStatus,
    handleClear,
    handleApplyRecoverableSuggestion,
    handleAnalyze,
    handleExecute,
  };
}
