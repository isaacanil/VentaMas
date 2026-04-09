type FlowTracePayload = {
  ts: number;
  event: string;
  data?: unknown;
  sessionId: string;
  path?: string;
  meta?: FlowTraceMeta;
};

type FlowTraceMeta = {
  userAgent?: string;
  platform?: string;
  language?: string;
  viewport?: { width: number; height: number; dpr: number };
  deviceType?: 'mobile' | 'desktop';
  online?: boolean;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
};

type FlowTraceOptions = {
  includeMeta?: boolean;
};

type FlowTraceConfig = {
  enableConsoleLog?: boolean;
  enableConsoleWarn?: boolean;
  enableConsoleError?: boolean;
  enableNetwork?: boolean;
  enableBreadcrumbs?: boolean;
  enableRageClicks?: boolean;
  breadcrumbLimit?: number;
  rageClickThreshold?: number;
  rageClickWindowMs?: number;
  includeMetaOnEvents?: boolean;
};

const MAX_DEPTH = 4;
const MAX_ARRAY = 30;
const MAX_KEYS = 40;
const MAX_STRING = 400;
const MAX_SNAPSHOT = 200000;

const isEnabled = import.meta.env.VITE_FLOW_TRACE === '1';
const rawEndpoint = import.meta.env.VITE_FLOW_TRACE_ENDPOINT as
  | string
  | undefined;

// Prevent Chrome Private Network Access prompt: never send to localhost/127.0.0.1
// from a non-local origin (e.g. staging or production).
const isLocalEndpoint =
  !!rawEndpoint &&
  (/localhost/i.test(rawEndpoint) || /127\.0\.0\.1/.test(rawEndpoint));
const isLocalOrigin =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');
const endpoint =
  isLocalEndpoint && !isLocalOrigin ? undefined : rawEndpoint;

const EXT_SESSION_KEY = '__flow_trace_session_id__';
let linkedSessionId: string | null = null;

const createFallbackSessionId = () =>
  `ft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getLinkedSessionId = () => {
  if (linkedSessionId) return linkedSessionId;
  if (typeof window === 'undefined') {
    linkedSessionId = createFallbackSessionId();
    return linkedSessionId;
  }
  try {
    const existing = window.sessionStorage?.getItem(EXT_SESSION_KEY);
    if (existing) {
      linkedSessionId = existing;
      return linkedSessionId;
    }
  } catch {
    // ignore
  }
  const fallback = createFallbackSessionId();
  linkedSessionId = fallback;
  try {
    window.sessionStorage?.setItem(EXT_SESSION_KEY, fallback);
  } catch {
    // ignore
  }
  return linkedSessionId;
};
let isTracing = false;
let flowTraceConfig: FlowTraceConfig = {
  enableConsoleLog: import.meta.env.VITE_FLOW_TRACE_CONSOLE_LOG === '1',
  enableConsoleWarn: true,
  enableConsoleError: true,
  enableNetwork: true,
  enableBreadcrumbs: true,
  enableRageClicks: true,
  breadcrumbLimit: 10,
  rageClickThreshold: 4,
  rageClickWindowMs: 1200,
  includeMetaOnEvents: true,
};

const getSafeConsole = () => {
  const win = typeof window !== 'undefined' ? window : undefined;
  const consoleRef = (win as typeof window & { __flowTraceConsole__?: Console })
    ?.__flowTraceConsole__;
  return consoleRef ?? console;
};

const getEnvMeta = (): FlowTraceMeta => {
  if (typeof window === 'undefined') return {};
  const nav = window.navigator;
  const isMobile =
    window.matchMedia?.('(pointer: coarse)')?.matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  const connection =
    nav && 'connection' in nav ? (nav as any).connection : null;
  return {
    userAgent: nav?.userAgent,
    platform: nav?.platform,
    language: nav?.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    },
    deviceType: isMobile ? 'mobile' : 'desktop',
    online: nav?.onLine,
    connection: connection
      ? {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }
      : undefined,
  };
};

const redactHeaders = (
  headers: Headers | Record<string, string> | undefined,
) => {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  const redact = (key: string, value: string) =>
    /authorization|cookie|token|apikey/i.test(key) ? '[REDACTED]' : value;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = redact(key, value);
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      result[key] = redact(key, String(value));
    });
  }
  return result;
};

const redactBody = (body: unknown) => {
  if (!body) return body;
  if (typeof body === 'string') {
    if (body.length > MAX_SNAPSHOT) {
      return `${body.slice(0, MAX_SNAPSHOT)}…`;
    }
    try {
      const parsed = JSON.parse(body);
      return redactBody(parsed);
    } catch {
      return body;
    }
  }
  if (typeof body !== 'object') return body;
  const redacted: Record<string, unknown> = {};
  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    if (/password|token|secret|authorization|card|cvv/i.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactBody(value);
    } else {
      redacted[key] = value;
    }
  });
  return redacted;
};

const safeNormalize = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return '[MaxDepth]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY)
      .map((item) => safeNormalize(item, depth + 1));
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(
    0,
    MAX_KEYS,
  );
  const result: Record<string, unknown> = {};
  entries.forEach(([key, entryValue]) => {
    result[key] = safeNormalize(entryValue, depth + 1);
  });
  return result;
};

const postTrace = async (payload: FlowTracePayload) => {
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    getSafeConsole().warn('[FlowTrace] Failed to send trace.', error);
  }
};

export const flowTrace = async (
  event: string,
  data?: unknown,
  options?: FlowTraceOptions,
) => {
  if (!isEnabled) return;
  const normalizedData =
    event === 'TRACE_SNAPSHOT' &&
    data &&
    typeof data === 'object' &&
    'snapshotContent' in data &&
    typeof (data as { snapshotContent?: unknown }).snapshotContent === 'string'
      ? {
          ...(data as Record<string, unknown>),
          snapshotContent: String(
            (data as { snapshotContent: string }).snapshotContent,
          ).slice(0, MAX_SNAPSHOT),
        }
      : safeNormalize(data);
  const payload: FlowTracePayload = {
    ts: Date.now(),
    event,
    data: normalizedData,
    sessionId: getLinkedSessionId(),
    path: typeof window !== 'undefined' ? window.location?.pathname : undefined,
    meta:
      options?.includeMeta || flowTraceConfig.includeMetaOnEvents
        ? getEnvMeta()
        : undefined,
  };

  if (typeof window !== 'undefined') {
    const win = window as typeof window & { __flowTrace?: FlowTracePayload[] };
    if (!win.__flowTrace) win.__flowTrace = [];
    win.__flowTrace.push(payload);
  }

  if (!isTracing) {
    try {
      isTracing = true;
      getSafeConsole().info(`[FlowTrace] ${event}`, payload.data ?? '');
      await postTrace(payload);
    } finally {
      isTracing = false;
    }
  }
};

const captureDomSnapshot = (): string | null => {
  if (typeof document === 'undefined') return null;
  const html = document.documentElement?.outerHTML ?? '';
  return html.length > MAX_SNAPSHOT ? `${html.slice(0, MAX_SNAPSHOT)}…` : html;
};

const captureStateSnapshot = (getState?: () => unknown): unknown => {
  if (!getState) return null;
  try {
    return getState();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

const getElementDescriptor = (target: EventTarget | null): string => {
  if (!target || !(target as Element).closest) return 'unknown';
  const el = (target as Element).closest(
    '[data-testid], [id], button, input, select, textarea, a',
  );
  if (!el) return (target as Element).tagName?.toLowerCase?.() ?? 'unknown';
  const id = el.getAttribute('id');
  const testId = el.getAttribute('data-testid');
  const name = el.getAttribute('name');
  const tag = el.tagName.toLowerCase();
  return [
    tag,
    id ? `#${id}` : '',
    testId ? `[data-testid=${testId}]` : '',
    name ? `[name=${name}]` : '',
  ]
    .filter(Boolean)
    .join('');
};

export const initFlowTrace = (params?: {
  getState?: () => unknown;
  config?: FlowTraceConfig;
}) => {
  if (!isEnabled || typeof window === 'undefined') return;
  const win = window as typeof window & {
    __flowTraceInitialized__?: boolean;
    __flowTraceConsole__?: Console;
    __flowTraceFetchWrapped__?: boolean;
    __flowTraceXhrWrapped__?: boolean;
    __flowTraceSnapshot?: () => void;
  };
  if (win.__flowTraceInitialized__) return;
  if (params?.config) {
    flowTraceConfig = { ...flowTraceConfig, ...params.config };
  }
  win.__flowTraceInitialized__ = true;
  win.__flowTraceConsole__ = console;

  void flowTrace('ENV_METADATA', getEnvMeta(), { includeMeta: true });

  const emitSnapshots = async (
    reason: string,
    extra?: Record<string, unknown>,
  ) => {
    const domSnapshot = captureDomSnapshot();
    if (domSnapshot) {
      await flowTrace(
        'TRACE_SNAPSHOT',
        { snapshotType: 'dom', reason, snapshotContent: domSnapshot, ...extra },
        { includeMeta: true },
      );
    }
    const stateSnapshot = captureStateSnapshot(params?.getState);
    if (stateSnapshot) {
      await flowTrace(
        'TRACE_SNAPSHOT',
        {
          snapshotType: 'state',
          reason,
          snapshotContent: stateSnapshot,
          ...extra,
        },
        { includeMeta: true },
      );
    }
  };

  win.__flowTraceSnapshot = () => {
    void emitSnapshots('manual');
  };

  window.addEventListener('error', (event) => {
    void flowTrace(
      'WINDOW_ERROR',
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? String(event.error) : undefined,
      },
      { includeMeta: true },
    );
    void emitSnapshots('window_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    void flowTrace(
      'UNHANDLED_REJECTION',
      {
        reason:
          event.reason instanceof Error
            ? { message: event.reason.message, stack: event.reason.stack }
            : event.reason,
      },
      { includeMeta: true },
    );
    void emitSnapshots('unhandled_rejection');
  });

  const originalConsoleError = console.error.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleLog = console.log.bind(console);
  if (flowTraceConfig.enableConsoleError) {
    console.error = (...args: unknown[]) => {
      if (!isTracing) {
        void flowTrace('CONSOLE_ERROR', { args }, { includeMeta: true });
      }
      originalConsoleError(...args);
    };
  }
  if (flowTraceConfig.enableConsoleWarn) {
    console.warn = (...args: unknown[]) => {
      if (!isTracing) {
        void flowTrace('CONSOLE_WARN', { args }, { includeMeta: true });
      }
      originalConsoleWarn(...args);
    };
  }
  if (flowTraceConfig.enableConsoleLog) {
    console.log = (...args: unknown[]) => {
      if (!isTracing) {
        void flowTrace('CONSOLE_LOG', { args }, { includeMeta: true });
      }
      originalConsoleLog(...args);
    };
  }

  if (
    flowTraceConfig.enableNetwork &&
    !win.__flowTraceFetchWrapped__ &&
    typeof window.fetch === 'function'
  ) {
    win.__flowTraceFetchWrapped__ = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [input, init] = args;
      const method = (init?.method || 'GET').toUpperCase();
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const start = performance.now();
      const headers = redactHeaders(
        init?.headers as Record<string, string> | undefined,
      );
      const body = redactBody(init?.body as unknown);
      const curl =
        typeof url === 'string'
          ? [
              'curl',
              '-X',
              method,
              `"${url}"`,
              headers
                ? Object.entries(headers)
                    .map(([key, value]) => `-H "${key}: ${value}"`)
                    .join(' ')
                : '',
              body ? `--data '${JSON.stringify(body)}'` : '',
            ]
              .filter(Boolean)
              .join(' ')
          : undefined;
      try {
        const response = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        void flowTrace(
          'NETWORK_FETCH',
          {
            method,
            url,
            status: response.status,
            ok: response.ok,
            durationMs: duration,
            curl,
          },
          { includeMeta: true },
        );
        return response;
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        void flowTrace(
          'NETWORK_FETCH_ERROR',
          {
            method,
            url,
            durationMs: duration,
            message: error instanceof Error ? error.message : String(error),
            curl,
          },
          { includeMeta: true },
        );
        throw error;
      }
    };
  }

  if (
    flowTraceConfig.enableNetwork &&
    !win.__flowTraceXhrWrapped__ &&
    window.XMLHttpRequest
  ) {
    win.__flowTraceXhrWrapped__ = true;
    const originalOpen = window.XMLHttpRequest.prototype.open;
    const originalSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      (this as any).__flowTraceMeta = { method, url };
      return originalOpen.call(this, method, url, ...rest);
    };
    window.XMLHttpRequest.prototype.send = function (...args) {
      const meta = (this as any).__flowTraceMeta || {};
      (this as any).__flowTraceBody = args?.[0];
      const start = performance.now();
      this.addEventListener('loadend', () => {
        const duration = Math.round(performance.now() - start);
        void flowTrace(
          'NETWORK_XHR',
          {
            method: meta.method,
            url: meta.url,
            status: (this as XMLHttpRequest).status,
            durationMs: duration,
          },
          { includeMeta: true },
        );
      });
      return originalSend.apply(this, args as any);
    };
  }

  if (flowTraceConfig.enableBreadcrumbs) {
    const breadcrumbLimit = flowTraceConfig.breadcrumbLimit ?? 10;
    const breadcrumbs: Array<{
      ts: number;
      type: string;
      target: string;
      value?: string;
    }> = [];

    const pushBreadcrumb = (entry: {
      ts: number;
      type: string;
      target: string;
      value?: string;
    }) => {
      breadcrumbs.push(entry);
      if (breadcrumbs.length > breadcrumbLimit) {
        breadcrumbs.shift();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = getElementDescriptor(event.target);
      pushBreadcrumb({ ts: Date.now(), type: 'click', target });
      if (flowTraceConfig.enableRageClicks) {
        const now = Date.now();
        const recentClicks = breadcrumbs.filter(
          (item) =>
            item.type === 'click' &&
            item.target === target &&
            now - item.ts <= (flowTraceConfig.rageClickWindowMs ?? 1200),
        );
        if (recentClicks.length >= (flowTraceConfig.rageClickThreshold ?? 4)) {
          void flowTrace(
            'RAGE_CLICK',
            { target, count: recentClicks.length },
            { includeMeta: true },
          );
        }
      }
    };

    const handleInput = (event: Event) => {
      const targetEl = event.target as HTMLInputElement | null;
      const target = getElementDescriptor(event.target);
      const value =
        targetEl && typeof targetEl.value === 'string'
          ? targetEl.value.slice(0, 50)
          : undefined;
      pushBreadcrumb({ ts: Date.now(), type: 'input', target, value });
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);

    const attachBreadcrumbs = async (reason: string) => {
      await flowTrace(
        'BREADCRUMBS',
        { reason, breadcrumbs: [...breadcrumbs] },
        { includeMeta: true },
      );
    };

    window.addEventListener('error', () => {
      void attachBreadcrumbs('window_error');
    });
    window.addEventListener('unhandledrejection', () => {
      void attachBreadcrumbs('unhandled_rejection');
    });
  }
};
