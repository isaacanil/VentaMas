import { shouldPolyfill } from '@formatjs/intl-segmenter/should-polyfill';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import './firebase/firebaseconfig';
import { AntConfigProvider } from './ant/AntConfigProvider';
import App from './App';
import './styles/normalize/normalize.css';
import './index.css';
import './variable.css';
import './styles/typography/typographyStyle.scss';
import './styles/theme.css';
import './styles/darkTheme.css';
import { store } from './app/store';
import AppProviders from './Context/AppProviders';
import i18n from './i18n';

(async () => {
  if (shouldPolyfill()) {
    await import('@formatjs/intl-segmenter/polyfill-force');
  }
})();

const queryClient = new QueryClient();

if (import.meta.env.PROD) {
  document.body.classList.add('production-mode');
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
                <App />
              </QueryClientProvider>
            </AntConfigProvider>
          </AppProviders>
        </I18nextProvider>
      </AntApp>
    </Provider>
  </StrictMode>,
);
