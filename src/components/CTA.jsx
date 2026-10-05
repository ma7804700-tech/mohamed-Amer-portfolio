import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { contactLinks } from '../data/contact'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'
import { publicAsset } from '../utils/publicAsset'

export default function CTA() {
  const { language } = usePreferences()
  const t = (key) => translate(language, key)

  return (
    <section className="cta section-pad" id="contact">
      <div className="section-wrap cta-inner">
        <div className="section-kicker"><span>{t('cta.kicker')}</span><span>{t('cta.availability')}</span></div>
        <img className="cta-portrait" src={publicAsset('/media/mohamed-cutout.png')} alt="" aria-hidden="true" />
        <span className="cta-note">{t('cta.note')}</span>
        <h2>{t('cta.title1')}<br />{t('cta.title2')} <i>{t('cta.move')}</i></h2>
        <div className="cta-bottom">
          <a className="button button-dark" href={contactLinks.whatsappPrimary} target="_blank" rel="noreferrer">{t('cta.start')} <ArrowRight size={17} /></a>
          <a className="cta-email" href={`mailto:${contactLinks.emailPrimary}`}><Mail size={15} /> {contactLinks.emailPrimary} <span>↗</span></a>
          <a className="cta-email" href={`mailto:${contactLinks.emailSecondary}`}><Mail size={15} /> {contactLinks.emailSecondary} <span>↗</span></a>
          <a className="cta-whatsapp" href={contactLinks.whatsappSecondary} target="_blank" rel="noreferrer"><MessageCircle size={15} /> {t('cta.whatsapp')} <span>↗</span></a>
          <span className="cta-location">{t('cta.location').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</span>
        </div>
      </div>
    </section>
  )
}
