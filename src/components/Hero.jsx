import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'
import { siteAsset } from '../utils/siteAsset'
import { useSiteContent } from '../context/SiteContentContext'

export default function Hero() {
  const { language } = usePreferences()
  const { siteContent } = useSiteContent()
  const { media, links } = siteContent
  const t = (key) => translate(language, key)

  return (
    <section className="hero section-wrap" id="top">
      <video className="hero-background-video" autoPlay muted loop playsInline preload="metadata" poster={siteAsset(media.heroPoster)} aria-hidden="true">
        <source src={siteAsset(media.heroVideo)} type="video/mp4" />
      </video>
      <div className="hero-meta"><span>{t('hero.location')}</span><span>{t('hero.worldwide')}</span></div>
      <div className="hero-layout">
        <div className="hero-copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>{t('hero.eyebrow')}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .18 }}>
            {t('hero.turning')}<br />{t('hero.ideas')}<br /><span className="headline-last">{t('hero.moving')} <i>{t('hero.stories')}</i></span>
          </motion.h1>
          <p className="hero-intro">{t('hero.intro')} <em>{t('hero.feel')}</em></p>
          <div className="hero-actions">
            <a className="button button-yellow" href="#work">{t('hero.view')} <ArrowDown size={15} /></a>
            <a className="button button-paper" href="#about">{t('hero.about')} <ArrowDownRight size={15} /></a>
            {links.whatsappPrimary && <a className="text-link" href={links.whatsappPrimary} target="_blank" rel="noreferrer">{t('hero.letsWork')} <ArrowUpRight size={15} /></a>}
          </div>
        </div>
        <div className="hero-art" aria-label={t('hero.portraitAlt')}>
          <div className="hero-paper-shadow" />
          <img
            className="hero-portrait"
            src={siteAsset(media.heroPortrait)}
            alt={t('hero.portraitAlt')}
          />
          <div className="hero-yellow-shape" />
          <div className="hero-red-shape" />
          <motion.div className="hero-note" initial={{ rotate: 8, scale: .7, opacity: 0 }} animate={{ rotate: 5, scale: 1, opacity: 1 }} transition={{ delay: .7, type: 'spring' }}>
            <span>{t('hero.years')}<br />{t('hero.editing')}</span><small>{t('hero.counting')}</small>
          </motion.div>
          <div className="tape tape-hero" />
          <span className="scribble hero-scribble">{t('hero.scribble')}</span>
          <div className="hero-stamp">{t('hero.cut')}</div>
        </div>
      </div>
      <div className="hero-bottom"><span>{t('hero.scroll')}</span><span className="hero-bottom-line" /><span>01 — {String(6).padStart(2, '0')}</span></div>
    </section>
  )
}
