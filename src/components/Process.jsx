import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

const steps = [
  ['01', 'process.understandTitle', 'process.understand'],
  ['02', 'process.buildTitle', 'process.build'],
  ['03', 'process.editTitle', 'process.edit'],
  ['04', 'process.polishTitle', 'process.polish'],
  ['05', 'process.deliverTitle', 'process.deliver'],
]

export default function Process() {
  const { language } = usePreferences()
  const t = (key) => translate(language, key)

  return (
    <section className="process section-pad">
      <div className="section-wrap">
        <div className="section-kicker"><span>{t('process.kicker')}</span><span>{t('process.promise')}</span></div>
        <div className="process-title"><h2>{t('process.how')}<br /><i>{t('process.magic')}</i></h2><span>{t('process.noMystery').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</span></div>
        <div className="process-line" aria-hidden="true" />
        <div className="process-steps">
          {steps.map(([number, titleKey, copyKey]) => (
            <article className="process-step" key={number}>
              <span className="process-dot" /><span className="process-number">{number}</span><h3>{t(titleKey)}</h3><p>{t(copyKey)}</p>
            </article>
          ))}
        </div>
        <div className="process-handwriting">{t('process.trust')} <span>↗</span></div>
      </div>
    </section>
  )
}
