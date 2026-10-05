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
          <button className="preference-toggle theme-toggle" aria-label={theme === 'dark' ? t('controls.switchDay') : t('controls.switchNight')} title={theme === 'dark' ? t('controls.switchDay') : t('controls.switchNight')} aria-pressed={theme === 'dark'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <span className="capsule-divider" aria-hidden="true" />
          <button className="preference-toggle language-toggle" lang={language === 'en' ? 'ar' : 'en'} aria-label={language === 'en' ? t('controls.switchArabic') : t('controls.switchEnglish')} title={language === 'en' ? t('controls.switchArabic') : t('controls.switchEnglish')} onClick={toggleLanguage}>
            {language === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
        <button className="menu-toggle" aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
