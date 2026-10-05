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
  const boardRef = useRef(null)
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

  return (
    <section className="portfolio section-wrap section-pad" id="work">
      <div className="section-kicker"><span>{t('portfolio.kicker')}</span><span>{allProjects.length} {language === 'ar' ? 'مشروعًا · أعمال مختارة' : 'PROJECTS · SELECTED CUTS'}</span></div>
      <div className="section-heading-row">
        <div><h2>{t('portfolio.selected')}<br /><span>{t('portfolio.work')}<span className="period">.</span></span></h2><span className="scribble work-scribble">{t('portfolio.note')}</span></div>
        <p className="section-intro">{t('portfolio.intro')}</p>
      </div>
      <div className="filter-row" aria-label="Filter portfolio projects">
        {filters.map(([item, key]) => <button key={item} className={filter === item ? 'filter-active' : ''} onClick={() => setFilter(item)}>{t(key)}</button>)}
      </div>
      <div className="project-grid-wrap">
        <CrimeThreads boardRef={boardRef} projectKey={`${filter}-${visibleProjects.map((project) => project.id).join('-')}`} />
        <div className="project-grid" ref={boardRef}>
        {visibleProjects.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} onSelect={onSelect} />)}
        </div>
      </div>
      <div className="portfolio-endnote"><span>{t('portfolio.latest')}</span><a href="https://drive.google.com/drive/folders/1ssxl66U8Zh2YaN4DtlWe6800MR6gPAQ1" target="_blank" rel="noreferrer">{t('portfolio.driveFolder')}</a></div>
    </section>
  )
}
