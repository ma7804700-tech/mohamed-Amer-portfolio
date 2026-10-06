import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Eye, Palette, RotateCcw, Save, Type } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { useSiteContent } from '../context/SiteContentContext'
import { editableTranslationGroups, defaultSiteContent } from '../data/siteDefaults'
import { translations } from '../data/translations'
import { siteAsset } from '../utils/siteAsset'

const colorFields = [
  ['paper', 'لون الورق / الخلفية النهارية'],
  ['ink', 'لون النص والخطوط'],
  ['yellow', 'اللون الأصفر المميز'],
  ['red', 'اللون الأحمر المميز'],
  ['darkPaper', 'خلفية الوضع الليلي'],
  ['darkInk', 'نص الوضع الليلي'],
]

const mediaFields = [
  ['heroPortrait', 'صورة المقدمة'],
  ['aboutPortrait', 'صورة قسم من أنا'],
  ['ctaPortrait', 'صورة قسم التواصل'],
  ['heroVideo', 'فيديو خلفية المقدمة'],
  ['heroPoster', 'صورة غلاف الفيديو'],
]

const linkFields = [
  ['whatsappPrimary', 'رابط واتساب الأساسي'],
  ['whatsappSecondary', 'رابط واتساب الإضافي'],
  ['phone', 'رابط الاتصال'],
  ['emailPrimary', 'البريد الإلكتروني الأساسي'],
  ['emailSecondary', 'البريد الإلكتروني الإضافي'],
  ['telegram', 'رابط تيليجرام'],
  ['linktree', 'رابط Linktree'],
  ['instagram', 'رابط Instagram'],
  ['youtube', 'رابط YouTube'],
  ['linkedin', 'رابط LinkedIn'],
]

const sectionNames = {
  hero: 'المقدمة',
  work: 'معرض الأعمال',
  services: 'الخدمات',
  about: 'من أنا',
  process: 'طريقة العمل',
  contact: 'التواصل',
}

const displayName = (key, prefix) => key.slice(prefix.length).replace(/([A-Z])/g, ' $1').replace(/([a-z])(\d)/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())

export default function SiteEditor() {
  const { language } = usePreferences()
  const { siteContent, saveSiteContent } = useSiteContent()
  const [draft, setDraft] = useState(() => structuredClone(siteContent))
  const [activeSection, setActiveSection] = useState('hero')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(structuredClone(siteContent))
  }, [siteContent])

  const activeGroup = editableTranslationGroups.find((group) => group.id === activeSection)
  const editableKeys = useMemo(() => {
    if (!activeGroup) return []
    return Object.keys(translations.en).filter((key) => activeGroup.prefix.some((prefix) => key.startsWith(prefix)))
  }, [activeGroup])

  const update = (path, value) => {
    setDraft((current) => {
      const next = structuredClone(current)
      let target = next
      for (const key of path.slice(0, -1)) target = target[key]
      target[path.at(-1)] = value
      return next
    })
    setSaved(false)
  }

  const moveSection = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= draft.sectionOrder.length) return
    const next = [...draft.sectionOrder]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(['sectionOrder'], next)
  }

  const resetDraft = () => {
    setDraft(structuredClone(defaultSiteContent))
    setSaved(false)
    setError('')
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const stored = await saveSiteContent(draft)
      setDraft(structuredClone(stored))
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message || 'تعذّر حفظ التعديلات.')
    } finally {
      setSaving(false)
    }
  }

  const previewTitleKey = editableKeys.find((key) => draft.translations.en[key]) || editableKeys[0]
  const previewTitle = previewTitleKey
    ? draft.translations[language][previewTitleKey] || translations[language][previewTitleKey] || translations.en[previewTitleKey]
    : sectionNames[activeSection] || 'Mohamed Amer'
  const previewImage = activeSection === 'about' ? draft.media.aboutPortrait : draft.media.heroPortrait

  return (
    <form className="site-editor" onSubmit={save}>
      <header className="site-editor-toolbar">
        <div className="site-editor-live"><Eye size={15} /><span>معاينة الموقع</span><i /></div>
        <div className="site-editor-actions">
          {saved && <span className="site-editor-saved"><Check size={14} />تم الحفظ</span>}
          <button className="site-editor-reset" type="button" onClick={resetDraft} disabled={saving}><RotateCcw size={14} />استعادة الافتراضي</button>
          <button className="site-editor-save" type="submit" disabled={saving}><Save size={15} />{saving ? 'جارٍ الحفظ…' : 'حفظ ونشر التعديلات'}</button>
        </div>
      </header>
      {error && <p className="admin-message" role="alert">{error}</p>}
      <div className="site-editor-layout">
        <nav className="site-editor-nav" aria-label="أقسام محرر الموقع">
          <span className="site-editor-nav-label">صفحات الموقع</span>
          {editableTranslationGroups.map((group) => (
            <button key={group.id} type="button" className={activeSection === group.id ? 'is-active' : ''} onClick={() => setActiveSection(group.id)}>
              <span>{group.title}</span><small>{group.id === 'nav' ? 'روابط' : 'نصوص'}</small>
            </button>
          ))}
          <span className="site-editor-nav-label">إعدادات عامة</span>
          <button type="button" className={activeSection === 'design' ? 'is-active' : ''} onClick={() => setActiveSection('design')}><span>التصميم والألوان</span><Palette size={14} /></button>
          <button type="button" className={activeSection === 'sections' ? 'is-active' : ''} onClick={() => setActiveSection('sections')}><span>ترتيب الأقسام</span><ArrowDown size={14} /></button>
          <button type="button" className={activeSection === 'media' ? 'is-active' : ''} onClick={() => setActiveSection('media')}><span>الصور والفيديو</span><Eye size={14} /></button>
          <button type="button" className={activeSection === 'links' ? 'is-active' : ''} onClick={() => setActiveSection('links')}><span>روابط التواصل</span><Eye size={14} /></button>
          <button type="button" className={activeSection === 'identity' ? 'is-active' : ''} onClick={() => setActiveSection('identity')}><span>هوية الموقع</span><Type size={14} /></button>
        </nav>

        <div className="site-editor-preview" data-theme-preview="dark">
          <span className="site-editor-preview-label">LIVE PREVIEW · {activeSection.toUpperCase()}</span>
          <div className="site-editor-preview-paper" style={{ background: draft.colors.paper, color: draft.colors.ink, boxShadow: `3px 4px 0 ${draft.colors.yellow}` }}>
            <span className="site-editor-preview-brand">{draft.branding.monogram}</span>
            {previewImage && <img src={siteAsset(previewImage)} alt="" onError={(event) => { event.currentTarget.hidden = true }} />}
            <strong dir={language === 'ar' ? 'rtl' : 'ltr'}>{previewTitle}</strong>
            <span className="site-editor-preview-rule" style={{ background: draft.colors.ink }} />
            <span className="site-editor-preview-caption">{language === 'ar' ? 'معاينة مباشرة · التغييرات تظهر بعد الحفظ' : 'LIVE PREVIEW · CHANGES APPLY AFTER SAVE'}</span>
          </div>
          <p>تعديل منظم يحافظ على شكل الموقع التحريري والقصاصات الورقية.</p>
        </div>

        <div className="site-editor-fields">
          {activeGroup && (
            <>
              <div className="site-editor-section-heading"><span>تحرير محتوى القسم</span><h3>{activeGroup.title}</h3><p>عدّل النصين العربي والإنجليزي؛ اترك الحقل فارغًا لاستخدام النص الأصلي.</p></div>
              <div className="site-editor-copy-list">
                {editableKeys.map((key) => {
                  const label = activeGroup.prefix.find((prefix) => key.startsWith(prefix))
                  const englishValue = draft.translations.en[key] ?? ''
                  const arabicValue = draft.translations.ar[key] ?? ''
                  return (
                    <fieldset className="site-editor-copy-field" key={key}>
                      <legend>{displayName(key, label)}</legend>
                      <label><span>English</span><textarea value={englishValue} onChange={(event) => update(['translations', 'en', key], event.target.value)} maxLength={2000} rows={englishValue.length > 95 ? 3 : 2} placeholder={translations.en[key]} /></label>
                      <label dir="rtl"><span>العربية</span><textarea value={arabicValue} onChange={(event) => update(['translations', 'ar', key], event.target.value)} maxLength={2000} rows={arabicValue.length > 95 ? 3 : 2} placeholder={translations.ar[key] || translations.en[key]} /></label>
                    </fieldset>
                  )
                })}
              </div>
            </>
          )}

          {activeSection === 'design' && (
            <>
              <div className="site-editor-section-heading"><span>VISUAL IDENTITY</span><h3>التصميم والألوان</h3><p>اختَر ألوانًا جديدة وستنعكس على الموقع في الوضعين الليلي والنهاري.</p></div>
              <div className="site-editor-color-grid">
                {colorFields.map(([key, label]) => <label key={key} className="site-editor-color"><span>{label}</span><input type="color" value={draft.colors[key]} onChange={(event) => update(['colors', key], event.target.value)} /><code>{draft.colors[key]}</code></label>)}
              </div>
              <div className="site-editor-palette-preview">{colorFields.map(([key]) => <span key={key} style={{ background: draft.colors[key] }} title={key} />)}</div>
            </>
          )}

          {activeSection === 'sections' && (
            <>
              <div className="site-editor-section-heading"><span>PAGE COMPOSITION</span><h3>ترتيب أقسام الموقع</h3><p>غيّر ترتيب ظهور الأقسام باستخدام الأسهم. المقدمة والأعمال وبقية الأقسام قابلة لإعادة الترتيب.</p></div>
              <ol className="site-editor-order">
                {draft.sectionOrder.map((section, index) => <li key={section}><span className="site-editor-order-index">{String(index + 1).padStart(2, '0')}</span><strong>{sectionNames[section]}</strong><div><button type="button" aria-label={`نقل ${sectionNames[section]} لأعلى`} disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`نقل ${sectionNames[section]} لأسفل`} disabled={index === draft.sectionOrder.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={15} /></button></div></li>)}
              </ol>
            </>
          )}

          {(activeSection === 'media' || activeSection === 'links' || activeSection === 'identity') && (
            <>
              <div className="site-editor-section-heading"><span>GLOBAL SETTINGS</span><h3>{activeSection === 'media' ? 'الصور والفيديو' : activeSection === 'links' ? 'روابط التواصل' : 'هوية الموقع'}</h3><p>تُطبّق هذه البيانات في كل مواضع ظهورها على الموقع.</p></div>
              <div className="site-editor-global-fields">
                {(activeSection === 'media' ? mediaFields : activeSection === 'links' ? linkFields : [['name', 'اسم صاحب الموقع'], ['monogram', 'العلامة المختصرة'], ['siteDescription', 'وصف نتائج البحث']]).map(([key, label]) => {
                  const group = activeSection === 'media' ? 'media' : activeSection === 'links' ? 'links' : 'branding'
                  const value = draft[group][key]
                  const isMediaImage = group === 'media' && /Portrait|Poster/.test(key)
                  return <label key={key}><span>{label}</span>{key === 'siteDescription' ? <textarea value={value} maxLength={2000} rows={3} onChange={(event) => update([group, key], event.target.value)} /> : <input dir="ltr" type="text" value={value} maxLength={group === 'branding' ? 80 : 2048} onChange={(event) => update([group, key], event.target.value)} placeholder={group === 'media' ? '/media/your-file.jpg or https://…' : 'https://…'} />}{isMediaImage && value && <img className="site-editor-media-preview" src={siteAsset(value)} alt={`معاينة ${label}`} onError={(event) => { event.currentTarget.hidden = true }} />}</label>
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
