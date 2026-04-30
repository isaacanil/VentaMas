import { shouldPolyfill } from '@formatjs/intl-segmenter/should-polyfill';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, notification } from 'antd';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import '@/firebase/firebaseconfig';
import { AntConfigProvider } from '@/ant/AntConfigProvider';
import App from '@/App';
import { injectTokens } from '@/design-system';
import '@/styles/global.css';

injectTokens();
import { store } from '@/app/store';
import AppProviders from '@/Context/AppProviders';
import i18n from '@/i18n';
import { ReducedMotionProvider } from '@/motion/ReducedMotionProvider';
import { initFlowTrace } from '@/utils/flowTrace';

(async () => {
  if (shouldPolyfill()) {
    await import('@formatjs/intl-segmenter/polyfill-force');
  }
})();

const queryClient = new QueryClient();

const normalizeNotificationArgs = (args: unknown) => {
  if (!args || typeof args !== 'object') return args;
  if ('title' in args) return args;
  if ('message' in args) {
    const { message, ...rest } = args as { message: unknown } & Record<
      string,
      unknown
    >;
    return { title: message, ...rest };
  }
  return args;
};

const wrapNotificationMethod = <
  T extends (...methodArgs: unknown[]) => unknown,
>(
  method: T,
) =>
  ((config: unknown, ...rest: unknown[]) =>
    method(normalizeNotificationArgs(config), ...rest)) as T;

notification.open = wrapNotificationMethod(notification.open);
notification.success = wrapNotificationMethod(notification.success);
notification.error = wrapNotificationMethod(notification.error);
notification.info = wrapNotificationMethod(notification.info);
notification.warning = wrapNotificationMethod(notification.warning);

if (import.meta.env.PROD) {
  document.body.classList.add('production-mode');
}

if (import.meta.env.VITE_FLOW_TRACE_AUTO === '1') {
  initFlowTrace({
    getState: store.getState,
    config: {
      enableConsoleLog: import.meta.env.VITE_FLOW_TRACE_CONSOLE_LOG === '1',
      enableConsoleWarn: true,
      enableConsoleError: true,
      enableNetwork: true,
      enableBreadcrumbs: true,
      enableRageClicks: true,
      breadcrumbLimit: 8,
      rageClickThreshold: 4,
      rageClickWindowMs: 1200,
      includeMetaOnEvents: true,
    },
  });
}

const root = document.getElementById('root');

ReactDOM.createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <AntApp>
        <I18nextProvider i18n={i18n}>
          <AppProviders>
            <AntConfigProvider>
              <QueryClientProvider client={queryClient}>
                <ReducedMotionProvider>
                  <App />
                </ReducedMotionProvider>
              </QueryClientProvider>
            </AntConfigProvider>
          </AppProviders>
        </I18nextProvider>
      </AntApp>
    </Provider>
  </StrictMode>,
);
