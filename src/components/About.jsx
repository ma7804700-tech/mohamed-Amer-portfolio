import { ArrowUpRight } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { translate } from '../data/translations'
import { siteAsset } from '../utils/siteAsset'

export default function About() {
  const { language } = usePreferences()
  const { siteContent } = useSiteContent()
  const { links } = siteContent
  const t = (key) => translate(language, key)

  return (
    <section className="about section-wrap section-pad" id="about">
      <div className="section-kicker"><span>{t('about.kicker')}</span><span>{t('about.location')}</span></div>
      <div className="about-grid">
        <div className="about-image-wrap">
          <div className="about-image"><img src={siteAsset(siteContent.media.aboutPortrait)} alt={t('about.portraitAlt')} loading="lazy" /></div>
          <span className="about-image-caption">{t('about.caption')}</span>
          <span className="about-doodle">{t('about.hello')}</span>
        </div>
        <div className="about-copy">
          <span className="about-overline">{t('about.overline')}</span>
          <h2>{t('about.title1')}<br />{t('about.title2')}<br /><i>{t('about.title3')}</i></h2>
          <p className="about-lead">{t('about.lead')}</p>
          <p className="about-body">{t('about.body')}</p>
          <div className="about-feature">
            <span className="about-feature-label">{t('about.platformLabel')}</span>
            <strong>{t('about.platformName')}</strong>
            <p>{t('about.platform')}</p>
          </div>
          <p className="about-outlook">{t('about.outlook')}</p>
          {links.emailPrimary && <a className="text-link" href={`mailto:${links.emailPrimary}`}>{t('about.contact')} <ArrowUpRight size={15} /></a>}
          <div className="about-stats"><div><strong>{t('about.yearsValue')}</strong><small>{t('about.years').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</small></div><div><strong>{t('about.storiesValue')}</strong><small>{t('about.stories').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</small></div><div><strong>{t('about.frameValue')}</strong><small>{t('about.frame').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</small></div></div>
        </div>
      </div>
    </section>
  )
}
