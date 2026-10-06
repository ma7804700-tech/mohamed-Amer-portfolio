import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpRight, CirclePlus, FolderKanban, Globe2, KeyRound, LockKeyhole, Pencil, Search, Save, Trash2, X } from 'lucide-react'
import { sortedProjects } from '../data/projects.ts'
import { getGoogleDriveOpenUrl } from '../utils/googleDrive.ts'
import { usePreferences } from '../context/PreferencesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { translate } from '../data/translations'
import SiteEditor from './SiteEditor'
import AdminPasswordChange from './AdminPasswordChange'

export default function Footer() {
  const projectAdminEnabled = import.meta.env.VITE_PROJECT_ADMIN !== 'false'
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminTab, setAdminTab] = useState('projects')
  const [authenticated, setAuthenticated] = useState(false)
  const [projects, setProjects] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [editDraft, setEditDraft] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('Reels')
  const [description, setDescription] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('All')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { language } = usePreferences()
  const { siteContent, reloadSiteContent } = useSiteContent()
  const t = (key) => translate(language, key)
  const visibleAdminProjects = useMemo(() => projects.filter((project) => {
    const matchesQuery = `${project.title} ${project.externalUrl}`.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase())
    return matchesQuery && (projectFilter === 'All' || project.category === projectFilter)
  }), [projects, projectQuery, projectFilter])
  const addedProjectCount = projects.filter((project) => !project.builtIn).length
  const readApiResponse = async (response, fallbackKey) => {
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error(t('admin.setupRequired'))
    }
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || t(fallbackKey))
    return data
  }
  useEffect(() => {
    if (!adminOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAdminOpen(false)
    }
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [adminOpen])
  const socials = [
    ['footer.whatsapp1', siteContent.links.whatsappPrimary],
    ['footer.whatsapp2', siteContent.links.whatsappSecondary],
    ['footer.call', siteContent.links.phone],
    ['footer.email1', `mailto:${siteContent.links.emailPrimary}`],
    ['footer.email2', `mailto:${siteContent.links.emailSecondary}`],
    ['footer.telegram', siteContent.links.telegram],
    ['footer.linktree', siteContent.links.linktree],
    ['footer.instagram', siteContent.links.instagram],
    ['footer.youtube', siteContent.links.youtube],
    ['footer.linkedin', siteContent.links.linkedin],
  ]

  const loadProjects = async () => {
    const response = await fetch('/api/projects')
    const data = await readApiResponse(response, 'admin.loadError')
    const overrideMap = new Map((data.overrides || []).map((item) => [item.id, item]))
    const combined = [
      ...sortedProjects.map((project) => ({
        ...project,
        ...overrideMap.get(project.id),
        externalUrl: project.videoSrc || getGoogleDriveOpenUrl(project.driveFileId, ''),
        builtIn: true,
      })),
      ...data.projects.map((project) => ({ ...project, builtIn: false })),
    ]
    const positions = new Map((data.order || []).map((id, index) => [id, index]))
    const ordered = combined.sort((left, right) => {
      const leftPosition = positions.get(left.id)
      const rightPosition = positions.get(right.id)
      if (leftPosition === undefined && rightPosition === undefined) return right.addedAt.localeCompare(left.addedAt)
      if (leftPosition === undefined) return 1
      if (rightPosition === undefined) return -1
      return leftPosition - rightPosition
    })
    setProjects(ordered)
    return ordered
  }

  const openAdmin = async () => {
    setAdminOpen(true)
    setAdminTab('projects')
    setPasswordChanged(false)
    setError('')
    try {
      const response = await fetch('/api/admin/session')
      const data = await readApiResponse(response, 'admin.loadError')
      setAuthenticated(data.authenticated)
      if (data.authenticated) {
        await Promise.all([loadProjects(), reloadSiteContent()])
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const login = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await readApiResponse(response, 'admin.loginError')
      setAuthenticated(true)
      setPassword('')
      setPasswordChanged(false)
      await Promise.all([loadProjects(), reloadSiteContent()])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const addProject = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, category, description }),
      })
      const data = await readApiResponse(response, 'admin.saveError')
      setTitle('')
      setUrl('')
      setDescription('')
      setAddOpen(false)
      const ordered = await loadProjects()
      const newProject = data.project
      const latest = [...ordered.filter((project) => project.id !== newProject.id)]
      latest.unshift({ ...newProject, builtIn: false })
      await saveProjectChanges([], latest)
      window.dispatchEvent(new Event('portfolio-projects-updated'))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const saveProjectChanges = async (updates, orderedProjects = projects) => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, order: orderedProjects.map((project) => project.id) }),
      })
      await readApiResponse(response, 'admin.saveError')
      await loadProjects()
      window.dispatchEvent(new Event('portfolio-projects-updated'))
      setEditingId('')
      setEditDraft(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const moveProject = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= projects.length) return
    const next = [...projects]
    ;[next[index], next[target]] = [next[target], next[index]]
    setProjects(next)
    saveProjectChanges([], next)
  }

  const startEditing = (project) => {
    setEditingId(project.id)
    setEditDraft({
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description || '',
    })
    setError('')
  }

  const restoreDefaultPortfolio = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/projects', { method: 'GET' })
      const data = await readApiResponse(response, 'admin.loadError')
      const order = [...data.projects.map((project) => project.id), ...sortedProjects.map((project) => project.id)]
      const updates = sortedProjects.map((project) => ({
        id: project.id,
        title: project.title,
        category: project.category,
        description: project.description,
      }))
      const saveResponse = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, order }),
      })
      await readApiResponse(saveResponse, 'admin.saveError')
      await loadProjects()
      window.dispatchEvent(new Event('portfolio-projects-updated'))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteProject = async (id) => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      await readApiResponse(response, 'admin.deleteError')
      await loadProjects()
      window.dispatchEvent(new Event('portfolio-projects-updated'))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' })
      await readApiResponse(response, 'admin.logoutError')
      setAuthenticated(false)
      setProjects([])
      setAdminTab('projects')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <footer className="footer section-wrap">
        <a className="footer-brand" href="#top"><span className="brand-mark">{siteContent.branding.monogram}<span>®</span></span><span>{siteContent.branding.name.split(' ').map((word) => <span key={word}>{word}<br /></span>)}</span></a>
        <p>{t('footer.role').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</p>
        <div className="footer-socials" aria-label={t('footer.socials')}>{socials.filter(([, url]) => url).map(([key, url]) => <a key={key} href={url} target={url.startsWith('https:') ? '_blank' : undefined} rel={url.startsWith('https:') ? 'noreferrer' : undefined}>{t(key)}<ArrowUpRight size={12} /></a>)}</div>
        <span className="copyright">{t('footer.copyright').split('<br />').map((line) => <span key={line}>{line}<br /></span>)}</span>
        {projectAdminEnabled && <button className="admin-open-button" type="button" onClick={openAdmin}><LockKeyhole size={13} />{t('admin.open')}</button>}
      </footer>
      {adminOpen && (
        <div className="admin-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAdminOpen(false)}>
          <section className={`admin-panel${authenticated && adminTab === 'site' ? ' has-site-editor' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <header className="admin-panel-header">
              <div className="admin-heading"><span className="admin-heading-icon"><FolderKanban size={20} /></span><div><span>{t('admin.eyebrow')}</span><h2 id="admin-title">{t('admin.title')}</h2><p>{t('admin.subtitle')}</p></div></div>
              <button type="button" onClick={() => setAdminOpen(false)} aria-label={t('admin.close')}><X size={19} /></button>
            </header>
            {error && <p className="admin-message" role="alert">{error}</p>}
            {passwordChanged && <p className="admin-password-changed" role="status">تم تغيير كلمة المرور. أدخل كلمة المرور الجديدة لتسجيل الدخول مرة أخرى.</p>}
            {!authenticated ? (
              <form className="admin-form" onSubmit={login}>
                <label>{t('admin.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
                <button className="button button-yellow" type="submit" disabled={busy}>{busy ? t('admin.working') : t('admin.unlock')}</button>
              </form>
            ) : (
              <>
                <nav className="admin-tabs" aria-label="Website administration">
                  <button type="button" className={adminTab === 'projects' ? 'is-active' : ''} onClick={() => setAdminTab('projects')}><FolderKanban size={15} />{t('admin.projectsTab')}</button>
                  <button type="button" className={adminTab === 'site' ? 'is-active' : ''} onClick={() => setAdminTab('site')}><Globe2 size={15} />{t('admin.siteTab')}</button>
                  <button type="button" className={adminTab === 'password' ? 'is-active' : ''} onClick={() => setAdminTab('password')}><KeyRound size={15} />تغيير كلمة المرور</button>
                </nav>
                {adminTab === 'site'
                  ? <SiteEditor />
                  : adminTab === 'password'
                    ? <AdminPasswordChange onChanged={() => { setAuthenticated(false); setAdminTab('projects'); setPasswordChanged(true) }} />
                    : <div className="admin-projects-tab">
                <div className="admin-overview">
                  <div><span>{t('admin.totalProjects')}</span><strong>{projects.length.toString().padStart(2, '0')}</strong></div>
                  <div><span>{t('admin.customProjects')}</span><strong>{addedProjectCount.toString().padStart(2, '0')}</strong></div>
                  <button className="admin-add-toggle" type="button" onClick={() => setAddOpen((open) => !open)} aria-expanded={addOpen}>
                    <CirclePlus size={17} />{addOpen ? t('admin.cancelAdd') : t('admin.add')}
                  </button>
                </div>
                {addOpen && <form className="admin-form" onSubmit={addProject}>
                  <label>{t('admin.projectTitle')}<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
                  <label>{t('admin.projectUrl')}<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." maxLength={2048} required /></label>
                  <label>{t('admin.category')}<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Promo">{t('category.promo')}</option><option value="Reels">{t('category.reels')}</option><option value="Long-form">{t('category.longForm')}</option><option value="Motion Graphics">{t('category.motion')}</option><option value="AI Workflows">{t('category.ai')}</option></select></label>
                  <label>{t('admin.description')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={600} rows={3} /></label>
                  <button className="button button-yellow" type="submit" disabled={busy}>{busy ? t('admin.working') : t('admin.add')}</button>
                </form>}
                <div className="admin-project-list">
                  <div className="admin-list-heading"><div><h3>{t('admin.savedProjects')}</h3><span>{t('admin.showingProjects').replace('{count}', String(visibleAdminProjects.length))}</span></div><div className="admin-list-tools">
                    <label className="admin-search"><Search size={15} /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder={t('admin.search')} aria-label={t('admin.search')} /></label>
                    <select className="admin-filter" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label={t('admin.filter')}>
                      <option value="All">{t('admin.allCategories')}</option><option value="Promo">{t('category.promo')}</option><option value="Reels">{t('category.reels')}</option><option value="Long-form">{t('category.longForm')}</option><option value="Motion Graphics">{t('category.motion')}</option><option value="AI Workflows">{t('category.ai')}</option>
                    </select>
                  </div></div>
                  {visibleAdminProjects.length ? visibleAdminProjects.map((project) => {
                    const index = projects.findIndex((item) => item.id === project.id)
                    return <article className={`admin-project-row${editingId === project.id ? ' is-editing' : ''}`} key={project.id}>
                      <span className="admin-project-index">{String(index + 1).padStart(2, '0')}</span>
                      <div className="admin-project-summary">
                        <strong>{project.title}</strong>
                        <div className="admin-project-meta"><span>{t(`category.${project.category === 'Long-form' ? 'longForm' : project.category === 'Motion Graphics' ? 'motion' : project.category === 'AI Workflows' ? 'ai' : project.category.toLowerCase()}`)}</span><span>{project.builtIn ? t('admin.originalProject') : t('admin.addedProject')}</span></div>
                        {project.externalUrl ? <a href={project.externalUrl} target="_blank" rel="noreferrer" dir="ltr">{project.externalUrl}<ArrowUpRight size={12} /></a> : <span className="admin-no-link">{t('admin.noLink')}</span>}
                      </div>
                      <div className="admin-project-controls">
                        <button type="button" onClick={() => moveProject(index, -1)} disabled={busy || index === 0} aria-label={`${t('admin.moveUp')} ${project.title}`}><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveProject(index, 1)} disabled={busy || index === projects.length - 1} aria-label={`${t('admin.moveDown')} ${project.title}`}><ArrowDown size={14} /></button>
                        <button type="button" onClick={() => startEditing(project)} disabled={busy} aria-label={`${t('admin.edit')} ${project.title}`}><Pencil size={13} /></button>
                        {!project.builtIn && <button type="button" onClick={() => deleteProject(project.id)} disabled={busy} aria-label={`${t('admin.delete')} ${project.title}`}><Trash2 size={14} /></button>}
                      </div>
                      {editingId === project.id && editDraft && <form className="admin-project-edit" onSubmit={(event) => { event.preventDefault(); saveProjectChanges([editDraft]) }}>
                        <label>{t('admin.projectTitle')}<input value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} maxLength={100} required /></label>
                        <label>{t('admin.projectUrlFixed')}<input value={project.externalUrl} readOnly dir="ltr" /></label>
                        <label>{t('admin.category')}<select value={editDraft.category} onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })}><option value="Promo">{t('category.promo')}</option><option value="Reels">{t('category.reels')}</option><option value="Long-form">{t('category.longForm')}</option><option value="Motion Graphics">{t('category.motion')}</option><option value="AI Workflows">{t('category.ai')}</option></select></label>
                        <label>{t('admin.description')}<textarea value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} maxLength={600} rows={2} /></label>
                        <div className="admin-project-edit-actions"><button type="submit" disabled={busy}><Save size={13} /> {t('admin.save')}</button><button type="button" onClick={() => { setEditingId(''); setEditDraft(null) }}>{t('admin.cancel')}</button></div>
                      </form>}
                    </article>
                  }) : <p className="admin-empty">{projectQuery || projectFilter !== 'All' ? t('admin.noMatches') : t('admin.empty')}</p>}
                </div>
                <button className="admin-restore" type="button" onClick={restoreDefaultPortfolio} disabled={busy}>{t('admin.restoreDefaults')}</button>
                <button className="admin-logout" type="button" onClick={logout} disabled={busy}>{t('admin.logout')}</button>
                </div>}
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
