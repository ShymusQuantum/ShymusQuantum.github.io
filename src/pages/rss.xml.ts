import { feed } from '../rss';
export const GET = ({ site }: { site: URL }) => feed('fr', site);
