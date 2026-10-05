import { useState } from 'react'
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react'
import { contactLinks } from '../data/contact'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

const navLinks = [
  ['nav.work', '#work'],
  ['nav.services', '#services'],
  ['nav.about', '#about'],
  ['nav.contact', '#contact'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { theme, language, toggleTheme, toggleLanguage } = usePreferences()
  const t = (key) => translate(language, key)

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Mohamed Amer home">
        <span className="brand-mark">MA<span>®</span></span>
        <span className="brand-name">MOHAMED<br />AMER</span>
      </a>
      <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label={t('nav.label')}>
        {navLinks.map(([key, href], index) => (
          <a key={href} className={index === 0 ? 'nav-active' : ''} href={href} onClick={() => setOpen(false)}>
            <span className="nav-index">0{index + 1}</span>{t(key)}
          </a>
        ))}
        <a className="nav-availability" href={contactLinks.whatsappPrimary} target="_blank" rel="noreferrer">{t('nav.available')} <ArrowUpRight size={13} /></a>
      </nav>
      <div className="header-tools">
        <div className="preference-capsule" role="group" aria-label={t('controls.preferences')}>
          <div className="capsule-group theme-segments" role="group" aria-label={t('controls.theme')}>
            <button className={`capsule-segment ${theme === 'light' ? 'is-selected' : ''}`} aria-label={t('controls.day')} title={t('controls.day')} aria-pressed={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}>
              <Sun size={14} aria-hidden="true" /><span>{t('controls.day')}</span>
            </button>
            <button className={`capsule-segment ${theme === 'dark' ? 'is-selected' : ''}`} aria-label={t('controls.night')} title={t('controls.night')} aria-pressed={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}>
              <Moon size={14} aria-hidden="true" /><span>{t('controls.night')}</span>
            </button>
          </div>
          <span className="capsule-divider" aria-hidden="true" />
          <div className="capsule-group language-segments" role="group" aria-label={t('controls.language')}>
            <button className={`capsule-segment ${language === 'en' ? 'is-selected' : ''}`} aria-label="English" title="English" aria-pressed={language === 'en'} onClick={() => language !== 'en' && toggleLanguage()}>EN</button>
            <button className={`capsule-segment ${language === 'ar' ? 'is-selected' : ''}`} lang="ar" aria-label="العربية" title="العربية" aria-pressed={language === 'ar'} onClick={() => language !== 'ar' && toggleLanguage()}>عربي</button>
          </div>
        </div>
        <button className="menu-toggle" aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
