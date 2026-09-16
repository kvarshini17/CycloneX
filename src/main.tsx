import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme'
import { SimulationProvider } from './context/SimulationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SimulationProvider>
        <App />
      </SimulationProvider>
    </ThemeProvider>
  </StrictMode>,
)
