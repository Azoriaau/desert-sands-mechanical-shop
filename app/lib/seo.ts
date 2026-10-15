import type {MetaDescriptor} from 'react-router';
import {site} from '~/lib/site';

const DEFAULT_TITLE = `${site.name} Shop | Diesel 4WD Parts & Performance, Geraldton WA`;

type SeoInput = {
  /** Page title without the site suffix. Omit for the home page. */
  title?: string | null;
  description?: string | null;
  /** Route path used for the canonical URL, e.g. "/collections/d-max". */
  path?: string;
  image?: string | null;
  noIndex?: boolean;
};

/** Builds the meta descriptors for a route, including canonical and Open Graph tags. */
export function seoMeta({
  title,
  description,
  path,
  image,
  noIndex,
}: SeoInput): MetaDescriptor[] {
  const fullTitle = title ? `${title} | ${site.name}` : DEFAULT_TITLE;
  const desc = description || site.description;
  const url = path ? new URL(path, site.url).toString() : undefined;

  const tags: MetaDescriptor[] = [
    {title: fullTitle},
    {name: 'description', content: desc},
    {property: 'og:title', content: fullTitle},
    {property: 'og:description', content: desc},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: site.name},
    {property: 'og:locale', content: 'en_AU'},
    {name: 'twitter:card', content: image ? 'summary_large_image' : 'summary'},
    {name: 'twitter:title', content: fullTitle},
    {name: 'twitter:description', content: desc},
  ];

  if (url) {
    tags.push({tagName: 'link', rel: 'canonical', href: url});
    tags.push({property: 'og:url', content: url});
  }
  if (image) {
    tags.push({property: 'og:image', content: image});
    tags.push({name: 'twitter:image', content: image});
  }
  if (noIndex) {
    tags.push({name: 'robots', content: 'noindex, follow'});
  }

  return tags;
}

/** Trims a long plain-text description to a meta-friendly length. */
export function truncate(text: string | null | undefined, max = 160) {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
