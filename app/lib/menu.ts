/**
 * Shop navigation comes from the Shopify "Main menu" (admin → Online Store →
 * Navigation), the same menu the old theme used, so the vehicle and brand
 * groupings stay editable in admin without a deploy.
 *
 * Expected shape (three levels, as the Storefront API returns them):
 *
 *   Make / Model  →  Toyota  →  N80 Hilux, Fortuner, …
 *                 →  Isuzu   →  D-Max, MUX
 *   Catalogue     →  Fatz Built, HPD, …
 *
 * Any top-level item with sub-items becomes a dropdown. The first group whose
 * sub-items have children of their own is treated as the vehicle menu
 * (makes → models); the rest are flat lists.
 */

export const SHOP_MENU_HANDLE = 'main-menu';

/** Structural shape of a Storefront API MenuItem, up to three levels deep. */
export type RawMenuItem = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  items?: RawMenuItem[] | null;
};

export type RawMenu = {items?: RawMenuItem[] | null} | null | undefined;

export type MenuLink = {
  id: string;
  title: string;
  href: string;
  /** Points off-site; render as a plain anchor rather than a router link. */
  external: boolean;
};

/** A make (with its models) or a brand (no children). */
export type MenuColumn = MenuLink & {children: MenuLink[]};

export type MenuGroup = {
  id: string;
  title: string;
  columns: MenuColumn[];
  /** True when the columns have children of their own (makes → models). */
  nested: boolean;
};

export type ShopMenu = {
  /** Every top-level item that has sub-items, in admin order. */
  groups: MenuGroup[];
  /** The makes → models group, if there is one. */
  vehicles: MenuGroup | null;
  /** The remaining groups, e.g. "Catalogue" (brands). */
  others: MenuGroup[];
};

export const EMPTY_SHOP_MENU: ShopMenu = {
  groups: [],
  vehicles: null,
  others: [],
};

/** Hostnames that count as "this store", whose links become relative routes. */
export function storeHosts(
  ...urls: Array<string | null | undefined>
): string[] {
  const hosts: string[] = [];
  for (const value of urls) {
    if (!value) continue;
    try {
      hosts.push(
        new URL(value.includes('://') ? value : `https://${value}`).hostname,
      );
    } catch {
      // Not a URL; ignore it.
    }
  }
  return hosts;
}

export function parseShopMenu(menu: RawMenu, hosts: string[]): ShopMenu {
  const groups: MenuGroup[] = [];

  for (const item of menu?.items ?? []) {
    const columns = (item.items ?? []).flatMap((column) => {
      const link = toLink(column, hosts);
      if (!link) return [];
      const children = (column.items ?? []).flatMap((child) => {
        const childLink = toLink(child, hosts);
        return childLink ? [childLink] : [];
      });
      return [{...link, children}];
    });
    if (columns.length === 0) continue;

    groups.push({
      id: item.id,
      title: item.title,
      columns,
      nested: columns.some((column) => column.children.length > 0),
    });
  }

  const vehicles = groups.find((group) => group.nested) ?? null;
  return {
    groups,
    vehicles,
    others: groups.filter((group) => group !== vehicles),
  };
}

/** Collection handle from a menu href like `/collections/bt50`, else null. */
export function collectionHandleFromHref(href: string): string | null {
  const match = /^\/collections\/([^/?#]+)/.exec(href);
  return match ? match[1] : null;
}

function toLink(item: RawMenuItem, hosts: string[]): MenuLink | null {
  const href = toHref(item.url, hosts);
  if (!href) return null;
  return {
    id: item.id,
    title: item.title,
    href,
    external: /^https?:/i.test(href),
  };
}

/**
 * Turns a menu URL into something the router can use: links into this store
 * become paths, anything else stays absolute. Placeholder "#" links used for
 * group headings in admin return null.
 */
function toHref(
  url: string | null | undefined,
  hosts: string[],
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.endsWith('#')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Already relative.
    return trimmed;
  }

  const isStore =
    hosts.includes(parsed.hostname) ||
    parsed.hostname.endsWith('.myshopify.com');
  if (!isStore) return trimmed;

  return `${parsed.pathname || '/'}${parsed.search}`;
}
