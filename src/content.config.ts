import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Chaque article est un fichier .md dans src/content/posts/fr/ ou src/content/posts/en/.
// Même nom de fichier dans les deux dossiers = même article traduit.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    event: z.string().optional(),       // ex. Starpwn CTF 2026 (pour les writeups)
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),        // ex. /images/posts/mon-image.jpg
    imageAlt: z.string().optional(),
    kind: z.enum(['article', 'writeup']).default('article'),  // writeup = solution de CTF
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
