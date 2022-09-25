import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './variable.css'
import './styles/normalize/normalize.css'

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

