import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultSiteContent } from '../data/siteDefaults'
import { setTranslationOverrides } from '../data/translations'

const SiteContentContext = createContext(null)
const sectionIds = new Set(defaultSiteContent.sectionOrder)
const colorKeys = Object.keys(defaultSiteContent.colors)
const mediaKeys = Object.keys(defaultSiteContent.media)
const linkKeys = Object.keys(defaultSiteContent.links)
const brandingKeys = Object.keys(defaultSiteContent.branding)

export function normalizeSiteContent(value) {
  const source = value && typeof value === 'object' ? value : {}
  const translations = source.translations && typeof source.translations === 'object' ? source.translations : {}
  const sectionOrder = Array.isArray(source.sectionOrder) ? source.sectionOrder : defaultSiteContent.sectionOrder
  const orderedSections = [...new Set(sectionOrder.filter((section) => sectionIds.has(section)))]
  for (const section of defaultSiteContent.sectionOrder) {
    if (!orderedSections.includes(section)) orderedSections.push(section)
  }
  const pick = (object, keys, defaults) => Object.fromEntries(keys.map((key) => [
    key,
    typeof object?.[key] === 'string' ? object[key] : defaults[key],
  ]))

  return {
    translations: {
      en: { ...(translations.en || {}) },
      ar: { ...(translations.ar || {}) },
    },
    colors: pick(source.colors, colorKeys, defaultSiteContent.colors),
    sectionOrder: orderedSections,
    media: pick(source.media, mediaKeys, defaultSiteContent.media),
    links: pick(source.links, linkKeys, defaultSiteContent.links),
    branding: pick(source.branding, brandingKeys, defaultSiteContent.branding),
  }
}

async function responseJson(response) {
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('إدارة الموقع متاحة بعد النشر على Cloudflare Pages فقط.')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'تعذّر حفظ إعدادات الموقع.')
  return data
}

export function SiteContentProvider({ children }) {
  const [siteContent, setSiteContent] = useState(defaultSiteContent)
  const [loaded, setLoaded] = useState(false)

  const reloadSiteContent = async () => {
    const response = await fetch('/api/site-content')
    const data = await responseJson(response)
    const content = normalizeSiteContent(data.content)
    setTranslationOverrides(content.translations)
    setSiteContent(content)
    return content
  }

  useEffect(() => {
    if (import.meta.env.VITE_PROJECT_ADMIN === 'false') {
      setLoaded(true)
      return undefined
    }
    let active = true
    reloadSiteContent()
      .then((content) => { if (active) setSiteContent(content) })
      .catch((error) => console.error('Unable to load website settings:', error))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setTranslationOverrides(siteContent.translations)
    const root = document.documentElement
    const { colors } = siteContent
    root.style.setProperty('--site-paper-light', colors.paper)
    root.style.setProperty('--site-ink-light', colors.ink)
    root.style.setProperty('--site-paper-dark', colors.darkPaper)
    root.style.setProperty('--site-ink-dark', colors.darkInk)
    root.style.setProperty('--yellow', colors.yellow)
    root.style.setProperty('--red', colors.red)
    document.title = `${siteContent.branding.name} — Video Editor & Motion Designer`
    document.querySelector('meta[name="description"]')?.setAttribute('content', siteContent.branding.siteDescription)
  }, [siteContent])

  const saveSiteContent = async (nextContent) => {
    const normalized = normalizeSiteContent(nextContent)
    const response = await fetch('/api/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: normalized }),
    })
    const data = await responseJson(response)
    const saved = normalizeSiteContent(data.content || normalized)
    setTranslationOverrides(saved.translations)
    setSiteContent(saved)
    window.dispatchEvent(new Event('site-content-updated'))
    return saved
  }

  const value = useMemo(() => ({ siteContent, loaded, reloadSiteContent, saveSiteContent }), [siteContent, loaded])
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)
  if (!context) throw new Error('useSiteContent must be used inside SiteContentProvider')
  return context
}
