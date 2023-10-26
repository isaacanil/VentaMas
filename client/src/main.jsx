import React, { Profiler } from 'react';
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

function onRenderCallback(
  id, // the "id" prop of the Profiler tree that has just committed
  phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
  interactions // the Set of interactions belonging to this update
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions,
  });
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <AppProviders>
        {/* <Profiler id="App" onRender={onRenderCallback}> */}
          <App />
        {/* </Profiler> */}
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