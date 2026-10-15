import {Suspense, useEffect, useId, useState} from 'react';
import {Await, Link, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Logo} from '~/components/Logo';
import {MenuItemLink} from '~/components/MenuItemLink';
import {nav, shopLinks, site, type NavItem} from '~/lib/site';
import type {MenuGroup, ShopMenu} from '~/lib/menu';
import {
  ArrowIcon,
  CartIcon,
  ChevronIcon,
  CloseIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
} from '~/components/icons';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  /** Vehicle and brand groups from the Shopify "Main menu". */
  menu: ShopMenu;
}

const barLinkClass =
  'inline-flex items-center gap-1.5 px-3 py-2 font-display text-sm uppercase tracking-wide text-fg/80 transition-colors hover:text-sand';

/**
 * Same header as the main site, plus search and cart controls and a shop bar
 * underneath for the Make / Model and brand menus. Every main nav item except
 * "Shop" links back to the main site.
 */
export function Header({cart, menu}: HeaderProps) {
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const {open: openAside} = useAside();

  // Close the menus after navigating.
  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // Escape closes an open dropdown wherever focus happens to be.
  useEffect(() => {
    if (!openGroup) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenGroup(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openGroup]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-ink/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Link
          to="/"
          prefetch="intent"
          aria-label={`${site.name} shop home`}
          className="shrink-0"
        >
          <Logo
            className="h-16 md:h-20"
            markClassName="mt-2 h-[5.25rem] w-auto shrink-0 self-start drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)] md:h-[6.5rem]"
            wordmark={false}
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <NavItemLink
              key={item.label}
              item={item}
              pathname={pathname}
              className={`px-3 py-2 font-display text-sm uppercase tracking-wide transition-colors hover:text-sand ${
                item.external ? 'text-fg/80' : 'text-sand'
              }`}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${site.phoneIntl}`}
            className="btn btn-primary hidden sm:inline-flex"
          >
            <PhoneIcon className="h-4 w-4" />
            <span className="hidden xl:inline">{site.phone}</span>
            <span className="xl:hidden">Call</span>
          </a>
          <button
            type="button"
            className="icon-btn"
            onClick={() => openAside('search')}
            aria-label="Search products"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <CartToggle cart={cart} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="icon-btn lg:hidden"
          >
            {open ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {menu.groups.length > 0 && (
        <div className="hidden border-t border-border/60 lg:block">
          <nav
            aria-label="Vehicles and brands"
            className="container-x relative flex h-11 items-center justify-center gap-1"
          >
            {menu.groups.map((group) => (
              <ShopMenuDropdown
                key={group.id}
                group={group}
                open={openGroup === group.id}
                onOpen={() => setOpenGroup(group.id)}
                onClose={() => setOpenGroup(null)}
              />
            ))}
            <Link
              to="/collections/all"
              prefetch="intent"
              className={barLinkClass}
            >
              All products
            </Link>
          </nav>
        </div>
      )}

      {open && (
        <div
          id="mobile-nav"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-ink-2 lg:hidden"
        >
          <nav aria-label="Mobile" className="container-x flex flex-col py-3">
            {menu.groups.map((group) => (
              <MobileMenuGroup
                key={group.id}
                group={group}
                onNavigate={() => setOpen(false)}
              />
            ))}
            <div className="grid grid-cols-2 gap-x-4 border-b border-border/60 py-3">
              {shopLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  prefetch="intent"
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm text-muted transition-colors hover:text-sand"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="eyebrow mt-5 text-[0.68rem]">Main site</p>
            {nav.map((item) => (
              <NavItemLink
                key={item.label}
                item={item}
                pathname={pathname}
                onClick={() => setOpen(false)}
                className={`border-b border-border/60 py-3 font-display text-lg uppercase tracking-wide ${
                  item.external ? 'text-fg' : 'text-sand'
                }`}
              />
            ))}
            <a href={`tel:${site.phoneIntl}`} className="btn btn-primary mt-4">
              <PhoneIcon className="h-4 w-4" />
              Call {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/**
 * One shop-bar dropdown. Opens on hover or click; closes on leave, Escape,
 * focus moving out, or navigation. Nested groups (makes → models) get a
 * full-width panel; flat groups get a list under the button.
 */
function ShopMenuDropdown({
  group,
  open,
  onOpen,
  onClose,
}: {
  group: MenuGroup;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const panelId = useId();

  return (
    <div
      className={`flex h-full items-center ${group.nested ? 'static' : 'relative'}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        className={`group ${barLinkClass} aria-expanded:text-sand`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="true"
        onClick={() => (open ? onClose() : onOpen())}
      >
        {group.title}
        <ChevronIcon className="h-3.5 w-3.5 transition-transform group-aria-expanded:rotate-180" />
      </button>
      {open && (
        <div
          id={panelId}
          className={`card absolute top-full z-50 shadow-[0_30px_60px_rgba(0,0,0,0.55)] ${
            group.nested ? 'inset-x-5 p-7' : 'left-0 min-w-60 p-2'
          }`}
        >
          {group.nested ? (
            <MakeModelColumns group={group} onNavigate={onClose} />
          ) : (
            <ul>
              {group.columns.map((link) => (
                <li key={link.id}>
                  <MenuItemLink
                    link={link}
                    onClick={onClose}
                    className="block rounded px-3 py-2 text-sm text-fg/85 transition-colors hover:bg-surface-2 hover:text-sand"
                  >
                    {link.title}
                  </MenuItemLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MakeModelColumns({
  group,
  onNavigate,
}: {
  group: MenuGroup;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-8">
      {group.columns.map((make) => (
        <div key={make.id}>
          <MenuItemLink
            link={make}
            onClick={onNavigate}
            className="font-display text-lg uppercase tracking-wide text-sand transition-colors hover:text-fg"
          >
            {make.title}
          </MenuItemLink>
          {make.children.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {make.children.map((model) => (
                <li key={model.id}>
                  <MenuItemLink
                    link={model}
                    onClick={onNavigate}
                    className="text-sm text-fg/85 transition-colors hover:text-sand"
                  >
                    {model.title}
                  </MenuItemLink>
                </li>
              ))}
            </ul>
          )}
          <MenuItemLink
            link={make}
            onClick={onNavigate}
            className="mt-4 inline-flex items-center gap-1 font-display text-xs uppercase tracking-wide text-muted transition-colors hover:text-sand"
          >
            All {make.title}
            <ArrowIcon className="h-3.5 w-3.5" />
          </MenuItemLink>
        </div>
      ))}
    </div>
  );
}

/** Accordion version of a shop-bar group for the mobile drawer. */
function MobileMenuGroup({
  group,
  onNavigate,
}: {
  group: MenuGroup;
  onNavigate: () => void;
}) {
  const linkClass = 'block py-1.5 text-sm text-fg/85';

  return (
    <details className="group/acc border-b border-border/60">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-lg uppercase tracking-wide text-fg [&::-webkit-details-marker]:hidden">
        {group.title}
        <ChevronIcon className="h-4 w-4 text-muted transition-transform group-open/acc:rotate-180" />
      </summary>
      <div className="pb-4">
        {group.nested ? (
          group.columns.map((make) => (
            <div key={make.id} className="mt-3 first:mt-0">
              <MenuItemLink
                link={make}
                onClick={onNavigate}
                className="font-display text-sm uppercase tracking-wide text-sand"
              >
                {make.title}
              </MenuItemLink>
              <ul className="mt-1 grid grid-cols-2 gap-x-4">
                {make.children.map((model) => (
                  <li key={model.id}>
                    <MenuItemLink
                      link={model}
                      onClick={onNavigate}
                      className={linkClass}
                    >
                      {model.title}
                    </MenuItemLink>
                  </li>
                ))}
                <li className="col-span-2">
                  <MenuItemLink
                    link={make}
                    onClick={onNavigate}
                    className="inline-flex items-center gap-1 py-1.5 text-sm text-muted"
                  >
                    All {make.title}
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </MenuItemLink>
                </li>
              </ul>
            </div>
          ))
        ) : (
          <ul className="grid grid-cols-2 gap-x-4">
            {group.columns.map((link) => (
              <li key={link.id}>
                <MenuItemLink
                  link={link}
                  onClick={onNavigate}
                  className={linkClass}
                >
                  {link.title}
                </MenuItemLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function NavItemLink({
  item,
  pathname,
  className,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  className: string;
  onClick?: () => void;
}) {
  if (item.external) {
    return (
      <a href={item.href} className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link
      to={item.href}
      prefetch="intent"
      className={className}
      onClick={onClick}
      aria-current={pathname === item.href ? 'page' : undefined}
    >
      {item.label}
    </Link>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="icon-btn"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <CartIcon className="h-5 w-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sand px-1 font-display text-[0.7rem] font-semibold text-ink"
        >
          {count}
        </span>
      )}
    </a>
  );
}
