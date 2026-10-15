import {Suspense, useEffect, useState} from 'react';
import {Await, Link, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Logo} from '~/components/Logo';
import {nav, shopLinks, site, type NavItem} from '~/lib/site';
import {
  CartIcon,
  CloseIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
} from '~/components/icons';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
}

/**
 * Same header as the main site, plus search and cart controls. Every nav item
 * except "Shop" links back to the main site.
 */
export function Header({cart}: HeaderProps) {
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const {open: openAside} = useAside();

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
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

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-border bg-ink-2 lg:hidden"
        >
          <nav aria-label="Mobile" className="container-x flex flex-col py-3">
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
            <div className="grid grid-cols-2 gap-x-4 py-3">
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
            <a
              href={`tel:${site.phoneIntl}`}
              className="btn btn-primary mt-2"
            >
              <PhoneIcon className="h-4 w-4" />
              Call {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
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
