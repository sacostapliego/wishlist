import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from './components/ui/provider.jsx'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider>
      <Analytics />
      <App />
    </Provider>
  </StrictMode>
)
