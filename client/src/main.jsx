import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import App from './App'
import './index.css'
import './variable.css'
import './styles/normalize/normalize.css'

// Sentry.init({
//   dsn: "https://b983bf1b536544d0b397d762e9a73f79@o4504832588054528.ingest.sentry.io/4504832611778560",
//   integrations: [new BrowserTracing()],
//   tracesSampleRate: 1.0,
// });

//redux
import { Provider } from 'react-redux'
import { store } from './app/store'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
  </React.StrictMode>
)

