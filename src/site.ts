// Réglages généraux du blog : modifie-les ici
import { getCollection } from 'astro:content';
import type { Lang } from './i18n';

export const SITE = {
  title: 'ShymusQuantum',
  author: 'ShymusQuantum',
  github: 'https://github.com/ShymusQuantum',
  // Photo de fond. Le déploiement télécharge la photo ESO si le fichier n'existe pas.
  // Pour en mettre une autre : remplace public/images/hero.jpg et ajuste le crédit.
  // sky = part haute de la photo occupée par le ciel (là où passent les satellites).
  background: {
    src: '/images/hero.jpg',
    sky: 0.5,
    credit: 'A. Duro/ESO',
    creditUrl: 'https://www.eso.org/public/images/duro_4776-cc/',
    license: 'CC BY 4.0',
  },
};

// Moyens de contact : remplis ceux que tu veux afficher, laisse '' pour masquer
export const CONTACTS = [
  { label: 'GitHub', value: 'ShymusQuantum', href: 'https://github.com/ShymusQuantum' },
  { label: 'Email', value: 'shymus.quantum@outlook.fr', href: 'mailto:shymus.quantum@outlook.fr' },
  { label: 'LinkedIn', value: '', href: '' },
  { label: 'X / Twitter', value: '', href: '' },
  { label: 'Discord', value: '', href: '' },
].filter((c) => c.value);

export async function getPosts(lang: Lang, kind?: 'article' | 'writeup') {
  const all = await getCollection('posts', ({ id, data }) =>
    !data.draft && id.startsWith(lang + '/') && (!kind || data.kind === kind));
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// "fr/bienvenue" -> "bienvenue"
export const postSlug = (id: string) => id.split('/').slice(1).join('/');

export function readingTime(text = '') {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}

export function formatDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
