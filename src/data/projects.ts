import { publicAsset } from '../utils/publicAsset.js'

export type ProjectCategory = 'AI Workflows' | 'Promo' | 'Reels' | 'Long-form' | 'Motion Graphics'
export type ProjectShape = 'wide' | 'tall' | 'standard'

export interface Project {
  id: string
  title: string
  client?: string
  category: ProjectCategory
  addedAt: string
  year?: string
  description: string
  poster?: string
  imageAlt: string
  driveFileId: string
  videoSrc?: string
  note: string
  shape: ProjectShape
}

export const driveFolderUrl = 'https://drive.google.com/drive/folders/1ssxl66U8Zh2YaN4DtlWe6800MR6gPAQ1'

const makeProject = (
  id: string,
  title: string,
  category: ProjectCategory,
  options: Partial<Pick<Project, 'driveFileId' | 'videoSrc' | 'poster' | 'addedAt'>> = {},
): Project => ({
  id,
  title,
  category,
  addedAt: '2026-01-01',
  description: `عمل من تصنيف ${category} — اختر مشاهدة المشروع. إن لم يتوفر رابط تشغيل مباشر، يمكنك فتح مجلد الأعمال على Google Drive.`,
  imageAlt: title,
  driveFileId: '',
  note: category.toUpperCase(),
  shape: Number(id) % 3 === 0 ? 'wide' : Number(id) % 3 === 1 ? 'standard' : 'tall',
  ...options,
})

export const projects: Project[] = [
  makeProject('01', 'القصر.mp4', 'Reels', { driveFileId: '1Q5qSZ1OAqw6pG9Mh9Px9NUgcrVXr9ljr', addedAt: '2026-09-26' }),
  makeProject('02', 'يعني هو اللايك زرار وخلاص؟', 'Reels', { driveFileId: '1RjwlIXA6lfGLgWvAEvGjFtl5H9eQc-Ji', addedAt: '2025-10-10' }),
  makeProject('03', 'إعلان بداية الشرح', 'Reels', { driveFileId: '1uPde4eWlDwYuPQPAlOvF7a56iY5Z4XaN', addedAt: '2026-08-03' }),
  makeProject('04', 'أبو الصادق', 'Reels', { driveFileId: '1vjx_ZWKI_RzbglYD06N35o0MIvZKiVh6', addedAt: '2026-06-17' }),
  makeProject('05', '3ashry 2 — افتر لسه', 'Reels', { driveFileId: '1uoz_mHp6yTSemZsV61nbZ72cPiysSjL-', addedAt: '2026-06-15' }),
  makeProject('06', '3SHRY', 'Reels', { driveFileId: '10rmMbUlf4pTO_-3iuu789vTw6ODTdLM-', addedAt: '2026-06-14' }),
  makeProject('07', '١١ سبتمبر', 'Reels', { driveFileId: '17pUzP0JDCChdz8qIujrxHgEggili1YOJ', addedAt: '2025-11-27' }),
  makeProject('08', '100.mp4', 'Reels', { driveFileId: '1C5WnMY81pPOG8ZhSrtRm_dwxL1nWKhQF', addedAt: '2025-10-10' }),
  makeProject('09', 'ابن الأزهر', 'Long-form', { driveFileId: '1K7WQ5lPoHiUDvHX_sPadgb_J1meDtXpC', addedAt: '2026-07-29' }),
  makeProject('10', 'الإخلاص', 'Long-form', { driveFileId: '1X5R_Cd1lMO8GZpxoSahQHFdxPGWPTTlx', addedAt: '2026-07-16' }),
  makeProject('11', 'الدولار', 'Motion Graphics', { driveFileId: '1dryrwMpEm6KmMTL3aELfT1pLvvWNkqu1', addedAt: '2026-07-09' }),
  makeProject('12', 'الزحمة وحشة 1', 'Reels', { driveFileId: '1c1L8unpA2-EB019p19893D__3Q3Frf3Y', addedAt: '2026-06-17' }),
  makeProject('13', 'الزحمة وحشة — SFX', 'Reels', { driveFileId: '1ccAvn3dhOVL7pCtmaBm-KR08hoU3Q75_', addedAt: '2026-04-01' }),
  makeProject('14', 'العدد المعطوف', 'Long-form', { driveFileId: '13o_d-xDF4oBxz9pvLJERm84WeK4ndIOe', addedAt: '2026-09-23' }),
  makeProject('15', 'العيبة Q', 'Reels', { driveFileId: '1bE1wJJ_eMIljTZHqxfcd1maFDeCG2LVH', addedAt: '2026-09-05' }),
  makeProject('16', 'القتل الرحيم FULL', 'Long-form', { driveFileId: '1_jCGaAcE4dbhCp3bYse3j9i548NPrrQt', addedAt: '2025-10-10' }),
  makeProject('17', 'نصائح الكيمياء', 'Long-form', { driveFileId: '1I7B_AgJG2vZwVEO50SmqxmHpxlzBpSSM', addedAt: '2026-08-21' }),
  makeProject('18', 'النظرية الأولى', 'Long-form', { driveFileId: '1au443_nocJx7xwUR4SwAGwl13rQN2JWH', addedAt: '2025-10-10' }),
  makeProject('19', 'بريشكا 2', 'Reels', { driveFileId: '1kG55Y-FKZc945UYsKB-9dgPiY_c3GkTY', addedAt: '2026-06-01' }),
  makeProject('20', 'ترويج كلية السياحة', 'Promo', { driveFileId: '11YQqnMqLwwQ06IzBFa46VhgPasUzL6kL', addedAt: '2026-07-04' }),
  makeProject('21', 'جرافيتي سهم', 'Motion Graphics', { driveFileId: '18FDeuYBNfCzZyjOHBNGh_C-OG54zjWn5', addedAt: '2025-10-10' }),
  makeProject('22', 'حنفي', 'Reels', { driveFileId: '1cXjPUwIjhUEYh2461hRHP9irAVHsM3Ex', addedAt: '2026-09-07' }),
  makeProject('23', 'ريندر 1', 'Motion Graphics', { driveFileId: '1oCON4eWQwPcy1M35apJHSvdCqXfaM8cd', addedAt: '2025-10-21' }),
  makeProject('24', 'شافعي', 'Reels', { driveFileId: '1OjWHQjFZr984UStpR2gOg3_JVxFvXDRI', addedAt: '2026-09-07' }),
  makeProject('25', 'عبدالله حبشي', 'Promo', { driveFileId: '1lfYgsjjnDaA5BKpSg1aN9Zlu2OCdYaCH', addedAt: '2026-09-21' }),
  makeProject('26', 'عني', 'Promo', { driveFileId: '15ENDRydeyZUliEjlg6MPqNGd7YyQ7aG5', addedAt: '2026-10-03' }),
  makeProject('27', 'فيديو التفاصيل', 'Long-form', { driveFileId: '1b60_b-jVmG-qYJtaROqZJ5ZssBXXMWyW', addedAt: '2026-08-08' }),
  makeProject('28', 'كورس الانطلاقة', 'Long-form', { driveFileId: '10vls_8KN_plu4M93h4V7EYIZXHrrOmk6', addedAt: '2026-09-16' }),
  makeProject('29', 'كورس العربي', 'Long-form', { driveFileId: '1m1A3ddH_zR8prk2CVLk_wLAzwexpJk7D', addedAt: '2026-09-11' }),
  makeProject('30', 'كيف تنشئ حسابًا على منصة ابن الأزهر', 'Long-form', { driveFileId: '1LQoY8yZx9e0TdagNTfazdtDL_qOhwOa1', addedAt: '2026-08-14' }),
  makeProject('31', 'معسكر النحو', 'Reels', { driveFileId: '1TjHR8ClV4Jg4AD4Jaw2IHohW-UR7ZXQB', addedAt: '2026-09-26' }),
  makeProject('32', 'موشن ديزاين', 'Motion Graphics', { addedAt: '2026-10-05',
    poster: publicAsset('/media/motion-design-poster.jpg'),
    videoSrc: publicAsset('/media/motion-design.mp4'),
  }),
]

export const sortedProjects = [...projects].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
