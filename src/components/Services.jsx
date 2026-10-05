import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

const services = [
  ['01', 'services.video', 'services.videoDesc'],
  ['02', 'services.motion', 'services.motionDesc'],
  ['03', 'services.social', 'services.socialDesc'],
  ['04', 'services.youtube', 'services.youtubeDesc'],
  ['05', 'services.commercial', 'services.commercialDesc'],
  ['06', 'services.ai', 'services.aiDesc'],
]

export default function Services() {
  const { language } = usePreferences()
  const t = (key) => translate(language, key)

  return (
      <section className="services section-pad" id="services">
      <div className="section-wrap">
          <div className="section-kicker"><span>{t('services.kicker')}</span><span>{t('services.promise')}</span></div>
          <div className="services-heading"><h2>{t('services.title')}<br /><i>{t('services.energy')}</i></h2><span className="services-arrow"><ArrowDownRight size={48} /></span></div>
          <div className="service-list">
            {services.map(([number, titleKey, descriptionKey]) => (
              <div className="service-row" key={number}>
                <span className="service-number">{number}</span><h3>{t(titleKey)}</h3><p>{t(descriptionKey)}</p><ArrowUpRight className="service-link" size={20} />
              </div>
            ))}
          </div>
          <div className="services-note"><span className="tape tape-services" /><span>{t('services.note').split('<br />').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</span></div>
      </div>
    </section>
  )
}
