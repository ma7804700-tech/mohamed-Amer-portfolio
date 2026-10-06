import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { translate } from '../data/translations'
import { siteAsset } from '../utils/siteAsset'

export default function CTA() {
  const { language } = usePreferences()
  const { siteContent } = useSiteContent()
  const { links, media } = siteContent
  const t = (key) => translate(language, key)

  return (
    <section className="cta section-pad" id="contact">
      <div className="section-wrap cta-inner">
        <div className="section-kicker"><span>{t('cta.kicker')}</span><span>{t('cta.availability')}</span></div>
        <img className="cta-portrait" src={siteAsset(media.ctaPortrait)} alt="" aria-hidden="true" />
        <span className="cta-note">{t('cta.note')}</span>
        <h2>{t('cta.title1')}<br />{t('cta.title2')} <i>{t('cta.move')}</i></h2>
        <div className="cta-bottom">
          {links.whatsappPrimary && <a className="button button-dark" href={links.whatsappPrimary} target="_blank" rel="noreferrer">{t('cta.start')} <ArrowRight size={17} /></a>}
          {links.emailPrimary && <a className="cta-email" href={`mailto:${links.emailPrimary}`}><Mail size={15} /> {links.emailPrimary} <span>↗</span></a>}
          {links.emailSecondary && <a className="cta-email" href={`mailto:${links.emailSecondary}`}><Mail size={15} /> {links.emailSecondary} <span>↗</span></a>}
          {links.whatsappSecondary && <a className="cta-whatsapp" href={links.whatsappSecondary} target="_blank" rel="noreferrer"><MessageCircle size={15} /> {t('cta.whatsapp')} <span>↗</span></a>}
          <span className="cta-location">{t('cta.location').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</span>
        </div>
      </div>
    </section>
  )
}
