import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { projects, sortedProjects } from '../data/projects.ts'
import PortfolioCard from './PortfolioCard'
import CrimeThreads from './CrimeThreads'
import { usePreferences } from '../context/PreferencesContext'
import { translate } from '../data/translations'

const filters = [
  ['All', 'filter.all'],
  ['Promo', 'filter.promo'],
  ['Reels', 'filter.reels'],
  ['Long-form', 'filter.longForm'],
  ['Motion Graphics', 'filter.motion'],
]

export default function Portfolio({ onSelect }) {
  const [filter, setFilter] = useState('All')
  const [remoteProjects, setRemoteProjects] = useState([])
  const [overrides, setOverrides] = useState([])
  const [projectOrder, setProjectOrder] = useState([])
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const [scrollBounds, setScrollBounds] = useState({ canGoBack: false, canGoForward: false })
  const boardRef = useRef(null)
  const pinRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const progressRef = useRef(null)
  const { language } = usePreferences()
  const t = (key) => translate(language, key)
  useEffect(() => {
    if (import.meta.env.VITE_PROJECT_ADMIN === 'false') return undefined
    let active = true
    const loadRemoteProjects = () => fetch('/api/projects')
      .then((response) => {
        if (!response.ok) throw new Error(`Project request failed (${response.status})`)
        return response.json()
      })
      .then((data) => {
        if (active && Array.isArray(data.projects)) {
          setRemoteProjects(data.projects)
          setOverrides(Array.isArray(data.overrides) ? data.overrides : [])
          setProjectOrder(Array.isArray(data.order) ? data.order : [])
        }
      })
      .catch((error) => { console.error('Unable to load added portfolio projects:', error) })
    loadRemoteProjects()
    window.addEventListener('portfolio-projects-updated', loadRemoteProjects)
    return () => {
      active = false
      window.removeEventListener('portfolio-projects-updated', loadRemoteProjects)
    }
  }, [])

  const allProjects = useMemo(() => {
    const overrideMap = new Map(overrides.map((item) => [item.id, item]))
    const combined = [
      ...sortedProjects.map((project) => ({ ...project, ...overrideMap.get(project.id) })),
      ...remoteProjects.map((project) => ({
        ...project,
        imageAlt: project.title,
        driveFileId: project.driveFileId || '',
        note: project.category.toUpperCase(),
        shape: 'standard',
      })),
    ]
    if (!projectOrder.length) return combined
    const positions = new Map(projectOrder.map((id, index) => [id, index]))
    return combined.sort((left, right) => {
      const leftPosition = positions.get(left.id)
      const rightPosition = positions.get(right.id)
      if (leftPosition === undefined && rightPosition === undefined) return right.addedAt.localeCompare(left.addedAt)
      if (leftPosition === undefined) return 1
      if (rightPosition === undefined) return -1
      return leftPosition - rightPosition
    })
  }, [remoteProjects, overrides, projectOrder])
  const displayProjects = useMemo(() => allProjects.map((project, index) => ({
    ...project,
    displayId: String(index + 1).padStart(2, '0'),
  })), [allProjects])
  const visibleProjects = useMemo(() => filter === 'All' ? displayProjects : displayProjects.filter((project) => project.category === filter), [displayProjects, filter])
  const projectKey = `${filter}-${visibleProjects.map((project) => project.id).join('-')}`

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const scrollBehavior = viewport.style.scrollBehavior
    viewport.style.scrollBehavior = 'auto'
    viewport.scrollLeft = 0
    viewport.style.scrollBehavior = scrollBehavior
  }, [projectKey])

  useEffect(() => {
    const pin = pinRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!pin || !viewport || !track) return undefined
    let frame = 0
    viewport.scrollLeft = 0

    const updateProgress = () => {
      frame = 0
      const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0)
      const progress = maxScroll ? Math.max(0, Math.min(1, viewport.scrollLeft / maxScroll)) : 0
      const cards = [...track.querySelectorAll('[data-project-card]')]
      const viewportLeft = viewport.getBoundingClientRect().left
      let nextIndex = 0
      let nearestDistance = Infinity
      if (progress >= 0.999) {
        nextIndex = Math.max(cards.length - 1, 0)
      } else {
        cards.forEach((card, index) => {
          const distance = Math.abs(card.getBoundingClientRect().left - viewportLeft)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nextIndex = index
          }
        })
      }
      setActiveProjectIndex((current) => current === nextIndex ? current : nextIndex)
      setScrollBounds((current) => {
        const nextBounds = { canGoBack: viewport.scrollLeft > 2, canGoForward: viewport.scrollLeft < maxScroll - 2 }
        return current.canGoBack === nextBounds.canGoBack && current.canGoForward === nextBounds.canGoForward ? current : nextBounds
      })

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`
        progressRef.current.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
      }
    }

    const scheduleProgressUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }

    const measure = () => {
      scheduleProgressUpdate()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(pin)
    observer.observe(track)
    const contentObserver = new MutationObserver(measure)
    contentObserver.observe(boardRef.current, { childList: true })
    viewport.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer.disconnect()
      contentObserver.disconnect()
      viewport.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', measure)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [projectKey])

  const moveGallery = (direction) => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.78,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <section className="portfolio section-wrap section-pad" id="work">
      <div className="section-kicker"><span>{t('portfolio.kicker')}</span><span>{allProjects.length} {language === 'ar' ? 'مشروعًا · أعمال مختارة' : 'PROJECTS · SELECTED CUTS'}</span></div>
      <div className="section-heading-row">
        <div><h2>{t('portfolio.selected')}<br /><span>{t('portfolio.work')}<span className="period">.</span></span></h2><span className="scribble work-scribble">{t('portfolio.note')}</span></div>
        <p className="section-intro">{t('portfolio.intro')}</p>
      </div>
      <div className="filter-row" aria-label="Filter portfolio projects">
        {filters.map(([item, key]) => <button key={item} className={filter === item ? 'filter-active' : ''} onClick={() => { setFilter(item); setActiveProjectIndex(0) }}>{t(key)}</button>)}
      </div>
      <div className="project-scroll-stage">
        <div className="project-scroll-pin" ref={pinRef}>
          <div className="project-scroll-viewport" ref={viewportRef} tabIndex="0" aria-label={t('portfolio.gallery')}>
            <div className="project-scroll-track" ref={trackRef}>
              <CrimeThreads boardRef={boardRef} projectKey={projectKey} />
              <div className="project-grid" ref={boardRef}>
                {visibleProjects.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} onSelect={onSelect} />)}
              </div>
            </div>
          </div>
          <div className="portfolio-gallery-controls">
            <button className="portfolio-gallery-arrow" type="button" onClick={() => moveGallery(-1)} disabled={!scrollBounds.canGoBack} aria-label={t('portfolio.previous')}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="portfolio-scroll-hint">{t('portfolio.scrollHint')}</span>
            <button className="portfolio-gallery-arrow" type="button" onClick={() => moveGallery(1)} disabled={!scrollBounds.canGoForward} aria-label={t('portfolio.next')}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="portfolio-scroll-progress">
            <span className="portfolio-scroll-count" dir="ltr" aria-live="polite">{String(Math.min(activeProjectIndex + 1, Math.max(visibleProjects.length, 1))).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}</span>
            <div className="portfolio-progress-track" role="progressbar" aria-label={t('portfolio.progress')} aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <span ref={progressRef} />
            </div>
          </div>
        </div>
      </div>
      <div className="portfolio-endnote"><span>{t('portfolio.latest')}</span><a href="https://drive.google.com/drive/folders/1ssxl66U8Zh2YaN4DtlWe6800MR6gPAQ1" target="_blank" rel="noreferrer">{t('portfolio.driveFolder')}</a></div>
    </section>
  )
}
