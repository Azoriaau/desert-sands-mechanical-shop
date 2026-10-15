import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Link,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {parseShopMenu, SHOP_MENU_HANDLE, storeHosts} from '~/lib/menu';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
import {ArrowIcon} from '~/components/icons';
import {seoMeta} from '~/lib/seo';
import {contactUrl} from '~/lib/site';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Root loader data (shop info, footer policies) rarely changes.
  return false;
};

/** Defaults for routes that don't export their own meta. */
export const meta: Route.MetaFunction = () => seoMeta({});

export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {headerMenuHandle: SHOP_MENU_HANDLE},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    header,
    shopMenu: parseShopMenu(
      header.menu,
      storeHosts(
        context.env.PUBLIC_STORE_DOMAIN,
        header.shop.primaryDomain.url,
      ),
    ),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

/**
 * The stylesheets are linked here rather than via `links()` to avoid a
 * development HMR bug ("failed to execute 'insertBefore' on 'Node'").
 * https://github.com/remix-run/remix/issues/9242
 */
export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en-AU" className="h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#0a0a0c" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const data = useRouteLoaderData<RootLoader>('root');
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const notFound = errorStatus === 404;

  const content = (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error {errorStatus}</p>
      <h1 className="mt-4 text-6xl md:text-8xl">
        {notFound ? 'Dead end.' : 'Something broke.'}
      </h1>
      <p className="mt-5 max-w-md text-muted">
        {notFound
          ? 'We couldn’t find that page. It may have moved, or the link’s seen better days. Let’s get you back on the road.'
          : 'Something went wrong on our end. Try again in a moment, or give the workshop a call.'}
      </p>
      {!notFound && import.meta.env.DEV && errorMessage ? (
        <pre className="mt-6 max-w-full overflow-x-auto rounded border border-border bg-surface p-4 text-left text-xs text-muted">
          {errorMessage}
        </pre>
      ) : null}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn btn-primary">
          Back to the shop
          <ArrowIcon className="h-4 w-4" />
        </Link>
        <a href={contactUrl} className="btn btn-outline">
          Contact us
        </a>
      </div>
    </section>
  );

  // Keep the header and footer around the error page when the root data loaded.
  return data ? <PageLayout {...data}>{content}</PageLayout> : content;
}
