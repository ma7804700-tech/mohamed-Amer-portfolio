import { contactLinks } from './contact'

export const defaultSiteContent = {
  translations: { en: {}, ar: {} },
  colors: {
    paper: '#F4F0E8',
    ink: '#111111',
    yellow: '#FFE600',
    red: '#E63946',
    darkPaper: '#171715',
    darkInk: '#F4F0E8',
  },
  sectionOrder: ['hero', 'work', 'services', 'about', 'process', 'contact'],
  media: {
    heroPortrait: '/media/mohamed-cutout.png',
    aboutPortrait: '/media/mohamed-cutout.png',
    ctaPortrait: '/media/mohamed-cutout.png',
    heroVideo: '/media/motion-design.mp4',
    heroPoster: '/media/motion-design-poster.jpg',
  },
  links: {
    whatsappPrimary: contactLinks.whatsappPrimary,
    whatsappSecondary: contactLinks.whatsappSecondary,
    phone: contactLinks.phone,
    emailPrimary: contactLinks.emailPrimary,
    emailSecondary: contactLinks.emailSecondary,
    telegram: contactLinks.telegram,
    linktree: contactLinks.linktree,
    instagram: '',
    youtube: '',
    linkedin: '',
  },
  branding: {
    name: 'Mohamed Amer',
    monogram: 'MA',
    siteDescription: 'Mohamed Amer is a video editor and motion graphics designer turning ideas into moving stories.',
  },
}

export const editableTranslationGroups = [
  { id: 'nav', title: 'Navigation', prefix: ['nav.'] },
  { id: 'hero', title: 'Hero', prefix: ['hero.'] },
  { id: 'portfolio', title: 'Portfolio', prefix: ['portfolio.', 'filter.', 'category.'] },
  { id: 'services', title: 'Services', prefix: ['services.'] },
  { id: 'about', title: 'About', prefix: ['about.'] },
  { id: 'process', title: 'Process', prefix: ['process.'] },
  { id: 'cta', title: 'Contact section', prefix: ['cta.'] },
  { id: 'footer', title: 'Footer', prefix: ['footer.'] },
  { id: 'modal', title: 'Video player', prefix: ['modal.'] },
]
