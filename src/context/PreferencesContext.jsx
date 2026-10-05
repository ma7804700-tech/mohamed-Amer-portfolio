import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState(() => localStorage.getItem('ma-language') || 'en')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171715' : '#f4f0e8')
    localStorage.setItem('ma-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('ma-language', language)
  }, [language])

  const value = useMemo(() => ({
    theme,
    language,
    toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light'),
    toggleLanguage: () => setLanguage((current) => current === 'en' ? 'ar' : 'en'),
  }), [theme, language])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext)
  if (!preferences) throw new Error('usePreferences must be used inside PreferencesProvider')
  return preferences
}
