/// <reference types="vite/client" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'tdesign-react'
import App from './App'
import 'tdesign-react/esm/style/index.js'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider globalConfig={{}}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
