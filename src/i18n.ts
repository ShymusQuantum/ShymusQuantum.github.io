// Textes de l'interface en français et en anglais.
// Le français est à la racine du site (/), l'anglais sous /en/.
export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];

// Intro de l'accueil, identique dans les deux langues
export const HERO = {
  hello: "hi! i'm Shymus",
  role: 'Researcher',
  title: 'cybersecurity, satellite & sigint.',
};

export const UI = {
  fr: {
    tagline: 'cybersécurité, radio & satellites',
    description: 'Recherches en cybersécurité, radio logicielle et satellites, par ShymusQuantum.',
    nav: { posts: 'articles', writeups: 'writeups', tags: 'tags', contact: 'contact', about: 'à propos' },
    skip: 'Aller au contenu',
    heroBio: "Je documente ici mes pensées et mes recherches : tout ce qui gravite autour de la cybersécurité spatiale, des signaux que les satellites murmurent vers la Terre aux stations sol qui leur répondent. Ondes, protocoles, CTF et nuits blanches à écouter le ciel.",
    readPosts: 'lire les articles →',
    whoAmI: 'qui suis-je →',
    latest: 'derniers articles',
    latestSub: 'récents & choisis',
    latestWriteups: 'derniers writeups',
    allPosts: 'tous les articles',
    allWriteups: 'tous les writeups',
    postsTitle: 'articles',
    postsSub: 'recherches, expériences et notes',
    writeupsTitle: 'writeups',
    writeupsSub: 'solutions de CTF et de challenges',
    tagsTitle: 'tags',
    allTags: 'tous les tags',
    published: (n: number) => `${n} publié${n > 1 ? 's' : ''}`,
    count: (n: number) => `${n} article${n > 1 ? 's' : ''}`,
    minRead: 'min de lecture',
    back: '← retour',
    empty: 'Rien pour le moment. Le premier arrive bientôt.',
    contactTitle: 'contact',
    contactIntro: "Une question sur un article, une idée de recherche, une proposition de CTF en équipe ? Écris-moi.",
    aboutTitle: 'à propos',
    notFound: 'signal perdu.',
    notFoundText: "Cette page est passée sous l'horizon. Elle n'existe pas ou a été déplacée.",
    home: 'retour à l’accueil →',
    switchLabel: 'English',
    photo: 'Photo de fond',
    notTranslated: "Cet article n'existe pas encore en anglais.",
  },
  en: {
    tagline: 'cybersecurity, radio & satellites',
    description: 'Research in cybersecurity, software-defined radio and satellites, by ShymusQuantum.',
    nav: { posts: 'posts', writeups: 'writeups', tags: 'tags', contact: 'contact', about: 'about me' },
    skip: 'Skip to content',
    heroBio: 'This is where I document my thoughts and research: everything orbiting space cybersecurity, from the signals satellites whisper down to Earth to the ground stations that answer them. Radio waves, protocols, CTFs and sleepless nights spent listening to the sky.',
    readPosts: 'read the posts →',
    whoAmI: 'about me →',
    latest: 'latest posts',
    latestSub: 'recent & handpicked',
    latestWriteups: 'latest writeups',
    allPosts: 'all posts',
    allWriteups: 'all writeups',
    postsTitle: 'posts',
    postsSub: 'research, experiments and notes',
    writeupsTitle: 'writeups',
    writeupsSub: 'CTF and challenge solutions',
    tagsTitle: 'tags',
    allTags: 'all tags',
    published: (n: number) => `${n} published`,
    count: (n: number) => `${n} post${n > 1 ? 's' : ''}`,
    minRead: 'min read',
    back: '← back',
    empty: 'Nothing here yet. The first one is coming soon.',
    contactTitle: 'contact',
    contactIntro: 'A question about a post, a research idea, want to team up for a CTF? Reach out.',
    aboutTitle: 'about me',
    notFound: 'signal lost.',
    notFoundText: 'This page has gone below the horizon. It does not exist or has moved.',
    home: 'back home →',
    switchLabel: 'Français',
    photo: 'Background photo',
    notTranslated: 'This post is not available in French yet.',
  },
};

// Construit un lien dans la bonne langue : href('en', '/posts/') -> '/en/posts/'
export const href = (lang: Lang, path: string) => (lang === 'fr' ? path : `/en${path}`);
export const other = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');
// Retire le préfixe de langue d'un chemin : '/en/posts/' -> '/posts/'
export const stripLang = (path: string) => path.replace(/^\/en(?=\/|$)/, '') || '/';
