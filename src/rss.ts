import rss from '@astrojs/rss';
import { SITE, getPosts, postSlug } from './site';
import { UI, href, type Lang } from './i18n';

export async function feed(lang: Lang, site: URL) {
  const posts = await getPosts(lang);
  return rss({
    title: SITE.title,
    description: UI[lang].description,
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: href(lang, `/posts/${postSlug(p.id)}/`),
    })),
  });
}
