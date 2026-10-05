import { useEffect, useState } from 'react'
import { ArrowUpRight, Maximize2, X } from 'lucide-react'
import { driveFolderUrl } from '../data/projects.ts'
import { getGoogleDriveOpenUrl, getGoogleDrivePreviewUrl, getVideoEmbedUrl } from '../utils/googleDrive.ts'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

export default function VideoModal({ project, onClose }) {
  const [failed, setFailed] = useState(false)
  const { language } = usePreferences()
  const t = (key) => translate(language, key)
  const previewUrl = getGoogleDrivePreviewUrl(project?.driveFileId || project?.externalUrl)
  const openUrl = project?.externalUrl || getGoogleDriveOpenUrl(project?.driveFileId, driveFolderUrl)
  const externalUrl = project?.externalUrl || ''
  const externalEmbedUrl = getVideoEmbedUrl(externalUrl)
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(externalUrl)
  const showExternalLink = !project?.videoSrc && !failed && Boolean(openUrl)

  useEffect(() => {
    setFailed(false)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [onClose, project])

  const fullscreen = () => {
    const player = document.querySelector('.video-player')
    if (player?.requestFullscreen) player.requestFullscreen()
  }

  if (!project) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="video-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-topline"><span>{t('modal.topline')}</span><button className="modal-close" onClick={onClose} aria-label={t('modal.close')}><X size={20} /></button></header>
        <div className="modal-player">
          {project.videoSrc && !failed ? (
            <>
              <video className="video-player" src={project.videoSrc} poster={project.poster} controls playsInline preload="metadata" onError={() => setFailed(true)} />
              <button className="fullscreen-button" onClick={fullscreen} aria-label={t('modal.fullscreen')}><Maximize2 size={17} /></button>
            </>
          ) : isDirectVideo && !failed ? (
            <>
              <video className="video-player" src={externalUrl} controls playsInline preload="metadata" onError={() => setFailed(true)} />
              <button className="fullscreen-button" onClick={fullscreen} aria-label={t('modal.fullscreen')}><Maximize2 size={17} /></button>
            </>
          ) : externalEmbedUrl && !failed ? (
            <>
              <iframe className="video-frame video-player" src={externalEmbedUrl} title={`${project.title} video preview`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onError={() => setFailed(true)} />
              <button className="fullscreen-button" onClick={fullscreen} aria-label={t('modal.fullscreen')}><Maximize2 size={17} /></button>
            </>
          ) : previewUrl && !failed ? (
            <>
              <iframe className="video-frame video-player" src={previewUrl} title={`${project.title} video preview`} allow="autoplay; picture-in-picture" allowFullScreen onError={() => setFailed(true)} />
              <button className="fullscreen-button" onClick={fullscreen} aria-label={t('modal.fullscreen')}><Maximize2 size={17} /></button>
            </>
          ) : (
            <div className="video-fallback">
              <div className="fallback-mark">MA<span>®</span></div>
              <p>{externalUrl ? t('modal.externalInfo') : project.driveFileId ? t('modal.permission') : t('modal.unavailable')}</p>
              <a href={openUrl} target="_blank" rel="noreferrer">{externalUrl ? t('modal.openLink') : project.driveFileId ? t('modal.openDrive') : t('modal.openFolder')} <ArrowUpRight size={15} /></a>
            </div>
          )}
        </div>
        {showExternalLink && <a className="modal-external-link" href={openUrl} target="_blank" rel="noreferrer">{previewUrl ? t('modal.drive') : t('modal.openLink')} <ArrowUpRight size={13} /></a>}
        <div className="modal-info">
          <div><span className="modal-category">{[project.category, project.year, project.client].filter(Boolean).join(' / ')}</span><h2 id="modal-title">{project.title}</h2></div>
          <p>{project.description || (language === 'ar' ? `مشروع من تصنيف ${project.category}.` : `Selected ${project.category.toLowerCase()} work.`)}</p>
        </div>
      </section>
    </div>
  )
}
