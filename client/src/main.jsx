import React from 'react';
import ReactDOM from 'react-dom/client';
import './firebase/firebaseconfig';

import App from './App';
import './index.css';
import './styles/normalize/normalize.css';
import './variable.css';
import './styles/typography/typographyStyle.scss';

import { Provider } from 'react-redux'
import { store } from './app/store'
import { StrictMode } from 'react';
import AppProviders from './Context/AppProviders';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <AppProviders>
          <App />
        </AppProviders>
      </I18nextProvider>
    </Provider>
  </React.StrictMode>
)





// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";
// Sentry.init({
//   dsn: "https://b983bf1b536544d0b397d762e9a73f79@o4504832588054528.ingest.sentry.io/4504832611778560",
//   integrations: [new BrowserTracing()],
//   tracesSampleRate: 1.0,
// });