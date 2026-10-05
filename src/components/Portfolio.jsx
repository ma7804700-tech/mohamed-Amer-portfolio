import { useEffect, useMemo, useRef, useState } from 'react'
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
  const boardRef = useRef(null)
  const stageRef = useRef(null)
  const pinRef = useRef(null)
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

  useEffect(() => {
    const stage = stageRef.current
    const pin = pinRef.current
    const track = trackRef.current
    if (!stage || !pin || !track) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let distance = 0

    const updatePosition = () => {
      frame = 0
      if (reducedMotion.matches) return

      const stickyTop = Number.parseFloat(getComputedStyle(pin).top) || 0
      const progress = distance
        ? Math.max(0, Math.min(1, (stickyTop - stage.getBoundingClientRect().top) / distance))
        : 0
      track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`

      const cards = track.querySelectorAll('[data-project-card]')
      const stride = cards[0]
        ? cards[0].getBoundingClientRect().width + Number.parseFloat(getComputedStyle(track).columnGap || '0')
        : 1
      const nextIndex = progress >= 0.999
        ? Math.max(cards.length - 1, 0)
        : Math.min(Math.floor((distance * progress) / Math.max(stride, 1)), Math.max(cards.length - 1, 0))
      setActiveProjectIndex((current) => current === nextIndex ? current : nextIndex)

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`
        progressRef.current.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
      }
    }

    const schedulePositionUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updatePosition)
    }

    const measure = () => {
      if (reducedMotion.matches) {
        stage.style.height = 'auto'
        track.style.transform = ''
        return
      }
      distance = Math.max(track.scrollWidth - pin.clientWidth, 0)
      stage.style.height = `${pin.clientHeight + distance}px`
      schedulePositionUpdate()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(pin)
    observer.observe(track)
    const contentObserver = new MutationObserver(measure)
    contentObserver.observe(boardRef.current, { childList: true })
    window.addEventListener('scroll', schedulePositionUpdate, { passive: true })
    window.addEventListener('resize', measure)
    reducedMotion.addEventListener('change', measure)
    measure()

    return () => {
      observer.disconnect()
      contentObserver.disconnect()
      window.removeEventListener('scroll', schedulePositionUpdate)
      window.removeEventListener('resize', measure)
      reducedMotion.removeEventListener('change', measure)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [projectKey])

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
      <div className="project-scroll-stage" ref={stageRef}>
        <div className="project-scroll-pin" ref={pinRef}>
          <div className="project-scroll-viewport">
            <div className="project-scroll-track" ref={trackRef}>
              <CrimeThreads boardRef={boardRef} projectKey={projectKey} />
              <div className="project-grid" ref={boardRef}>
                {visibleProjects.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} onSelect={onSelect} />)}
              </div>
            </div>
          </div>
          <div className="portfolio-scroll-progress">
            <span>{t('portfolio.scrollHint')}</span>
            <span className="portfolio-scroll-count" aria-live="polite">{String(Math.min(activeProjectIndex + 1, Math.max(visibleProjects.length, 1))).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}</span>
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
