import { ArrowUpRight, Play } from 'lucide-react'
import { useState } from 'react'
import { getGoogleDrivePreviewUrl, getVideoEmbedUrl, getVideoThumbnailUrl } from '../utils/googleDrive.ts'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

export default function PortfolioCard({ project, index, onSelect }) {
  const poster = project.poster || getVideoThumbnailUrl(project.driveFileId || project.externalUrl)
  const displayId = project.displayId || project.id
  const { language } = usePreferences()
  const categoryKey = {
    Promo: 'category.promo',
    Reels: 'category.reels',
    'Long-form': 'category.longForm',
    'Motion Graphics': 'category.motion',
    'AI Workflows': 'category.ai',
  }[project.category]
  const category = translate(language, categoryKey)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const drivePreview = getGoogleDrivePreviewUrl(project.driveFileId || project.externalUrl)
  const providerPreview = getVideoEmbedUrl(project.videoSrc || project.externalUrl)
  const previewUrl = drivePreview || providerPreview
  const directVideo = project.videoSrc && /\.(?:mp4|webm|ogg)(?:$|[?#])/i.test(project.videoSrc)

  return (
    <button className={`project-card project-${project.shape}`} data-project-card dir={language === 'ar' ? 'rtl' : 'ltr'} onClick={() => onSelect(project)} onMouseEnter={() => setIsPreviewing(true)} onMouseLeave={() => setIsPreviewing(false)} onFocus={() => setIsPreviewing(true)} onBlur={() => setIsPreviewing(false)} aria-label={`${language === 'ar' ? 'افتح ملف المشروع' : 'Open case file'} ${project.title}`}>
      <span className="case-file-tab">{language === 'ar' ? 'ملف قضية' : 'CASE FILE'} <span>NO. {displayId}</span></span>
      <span className="case-paperclip" aria-hidden="true" />
      <div className="case-file-paper">
        <div className="case-file-heading">
          <span>{language === 'ar' ? 'ملف أعمال' : 'CREATIVE CASE FILE'}</span>
          <span>{project.year || '2026'}</span>
        </div>
        <div className="project-image">
          <div className={`project-art project-art-${index % 4}`}>
            <span className="project-art-index">{displayId}</span>
            <span className="project-art-title" lang="ar" dir="rtl">{project.title}</span>
            <span className="project-art-category">{category}</span>
          </div>
          {poster && <img src={poster} alt={project.imageAlt} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
          {isPreviewing && directVideo && <video className="project-hover-video" src={project.videoSrc} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />}
          {isPreviewing && !directVideo && previewUrl && <iframe className="project-hover-video" src={`${previewUrl}${previewUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1`} title={`${project.title} video preview`} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" tabIndex={-1} />}
          <span className="project-number">{displayId}</span>
          <span className="project-play"><Play fill="currentColor" size={16} /></span>
          <span className="confidential-stamp">{language === 'ar' ? 'سري' : <>CASE<br />STUDY</>}</span>
        </div>
        <div className="case-file-meta">
          <div className="case-file-project-title"><span>{language === 'ar' ? 'اسم المشروع' : 'PROJECT'}</span><h3>{project.title}</h3></div>
          <span className="case-file-category"><span>{language === 'ar' ? 'التصنيف' : 'CLASSIFICATION'}</span><strong>{category}</strong></span>
        </div>
        <div className="case-file-footer">
          <span>{language === 'ar' ? 'اضغط لعرض الأدلة' : 'OPEN EVIDENCE'}</span>
          <ArrowUpRight size={15} />
        </div>
      </div>
    </button>
  )
}
