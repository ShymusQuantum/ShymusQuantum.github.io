// Réglages généraux du blog : modifie-les ici
export const SITE = {
  title: 'ShymusQuantum',
  tagline: 'cybersécurité, radio & satellites',
  description: "Recherches en cybersécurité, radio logicielle et satellites, par ShymusQuantum.",
  author: 'ShymusQuantum',
  github: 'https://github.com/ShymusQuantum',
};

export const NAV = [
  { href: '/posts/', label: 'articles' },
  { href: '/tags/', label: 'tags' },
  { href: '/about/', label: 'à propos' },
];

import { getCollection } from 'astro:content';
export async function getPosts() {
  const all = await getCollection('posts', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function readingTime(text = '') {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
