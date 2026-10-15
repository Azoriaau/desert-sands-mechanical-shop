/**
 * Business details shared with the main site
 * (desert-sands-mechanical/lib/site.ts). Keep the two in sync.
 */
export const site = {
  name: 'Desert Sands Mechanical',
  legalName: 'Desert Sands Mechanical Pty Ltd',
  short: 'DSM',
  tagline: '4WD Tuning · Diesel Performance',
  description:
    'Diesel 4WD performance parts from the Geraldton workshop that tunes them: intercoolers, catch cans, airboxes, injectors, exhausts and more, chosen and fitted by Desert Sands Mechanical.',
  /** Canonical origin of this storefront. */
  url: 'https://shop.desertsandsmechanical.com',
  /** The main marketing site; most nav links point back to it. */
  mainSiteUrl: 'https://www.desertsandsmechanical.com',
  abn: '82 632 154 093',
  phone: '0407 295 782',
  phoneIntl: '+61407295782',
  email: 'office@desertsandsmechanical.com',
  areaServed: 'Geraldton and the Midwest, Western Australia',
  address: {
    street: '76 Edward Road',
    suburb: 'Utakarra',
    state: 'WA',
    postcode: '6530',
    country: 'AU',
  },
  hours: {
    weekday: 'Monday – Friday, 8:00am – 5:00pm',
  },
  social: {
    facebook: 'https://www.facebook.com/desertsandsmechanical/',
    instagram: 'https://www.instagram.com/desertsandsmechanical/',
    tiktok: 'https://www.tiktok.com/@desertsandsmechanical',
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  /** Absolute link to the main site rather than a route in this app. */
  external: boolean;
};

/**
 * Same items, same order as the main site's header. Everything except "Shop"
 * is an absolute link back to the main site so the two feel like one site.
 */
export const nav: readonly NavItem[] = [
  {label: 'Home', href: `${site.mainSiteUrl}/`, external: true},
  {label: 'Tuning', href: `${site.mainSiteUrl}/tuning`, external: true},
  {
    label: 'Diesel 4WDs',
    href: `${site.mainSiteUrl}/diesel-4wd`,
    external: true,
  },
  {
    label: 'Road Transport',
    href: `${site.mainSiteUrl}/road-transport`,
    external: true,
  },
  {
    label: 'Earthmoving & Plant',
    href: `${site.mainSiteUrl}/earthmoving-plant`,
    external: true,
  },
  {
    label: 'Equipment Hire',
    href: `${site.mainSiteUrl}/equipment-hire`,
    external: true,
  },
  {label: 'Shop', href: '/', external: false},
  {label: 'Contact', href: `${site.mainSiteUrl}/contact`, external: true},
];

/** Shop-only links used in the footer and the mobile menu. */
export const shopLinks = [
  {label: 'All products', href: '/collections/all'},
  {label: 'Collections', href: '/collections'},
  {label: 'Search', href: '/search'},
  {label: 'Cart', href: '/cart'},
] as const;

export const contactUrl = `${site.mainSiteUrl}/contact`;

export const stats = [
  {value: '15+', label: 'Years trade experience'},
  {value: 'In-house', label: 'Dyno tuning'},
  {value: 'Utakarra', label: 'Workshop fitting'},
  {value: 'Licensed', label: 'WA repairer'},
];
