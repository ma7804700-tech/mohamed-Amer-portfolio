import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { SiteContentProvider } from './context/SiteContentContext.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreferencesProvider>
      <SiteContentProvider>
        <App />
      </SiteContentProvider>
    </PreferencesProvider>
  </React.StrictMode>,
)
