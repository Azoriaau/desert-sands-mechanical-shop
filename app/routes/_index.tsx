import {Await, Link, useLoaderData, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RootLoader} from '~/root';
import {ProductGridSkeleton, ProductItem} from '~/components/ProductItem';
import {CollectionCard} from '~/components/CollectionCard';
import {MenuItemLink} from '~/components/MenuItemLink';
import {MockShopNotice} from '~/components/MockShopNotice';
import {CTABand} from '~/components/CTABand';
import {ArrowIcon} from '~/components/icons';
import {COLLECTION_CARD_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {EMPTY_SHOP_MENU, type MenuColumn, type MenuGroup} from '~/lib/menu';
import {seoMeta} from '~/lib/seo';
import {site} from '~/lib/site';

export const meta: Route.MetaFunction = () => seoMeta({path: '/'});

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(HOME_COLLECTIONS_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    collections: collections.nodes,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const latestProducts = context.storefront
    .query(LATEST_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    latestProducts,
  };
}

export default function Homepage() {
  const {collections, latestProducts, isShopLinked} =
    useLoaderData<typeof loader>();
  // The Make / Model group comes from the Shopify main menu, loaded once in
  // the root loader for the header. Without one, fall back to a plain grid of
  // collections.
  const {vehicles} =
    useRouteLoaderData<RootLoader>('root')?.shopMenu ?? EMPTY_SHOP_MENU;

  return (
    <>
      {isShopLinked ? null : <MockShopNotice />}

      <section className="relative overflow-hidden border-b border-border bg-ink">
        <div className="dusk absolute inset-0" aria-hidden />
        <div className="container-x relative pt-16 pb-24 md:pt-24 md:pb-32">
          <p className="eyebrow">{site.name} · Online shop</p>
          <h1 className="mt-4 max-w-4xl text-5xl md:text-7xl">
            Parts that <span className="text-stroke">pull their weight.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Intercoolers, catch cans, airboxes, injectors and exhausts for
            diesel 4WDs, chosen by the workshop that tunes them. Buy online, or
            ask us to fit it in the workshop.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/collections/all"
              prefetch="intent"
              className="btn btn-primary"
            >
              Shop all products
              <ArrowIcon className="h-4 w-4" />
            </Link>
            {vehicles ? (
              <a href="#vehicles" className="btn btn-outline">
                Shop by vehicle
              </a>
            ) : (
              <Link
                to="/collections"
                prefetch="intent"
                className="btn btn-outline"
              >
                Browse collections
              </Link>
            )}
          </div>
        </div>
      </section>

      {vehicles ? (
        <VehicleSection group={vehicles} />
      ) : (
        <section className="container-x py-14 md:py-20">
          <SectionHeading
            eyebrow="Shop by"
            title="Collection"
            linkTo="/collections"
            linkLabel="All collections"
          />
          {collections.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collections.map((collection, index) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-muted">No collections yet.</p>
          )}
        </section>
      )}

      <section className="border-y border-border bg-surface/40">
        <div className="container-x py-14 md:py-20">
          <SectionHeading
            eyebrow="Fresh on the shelf"
            title="Latest products"
            linkTo="/collections/all"
            linkLabel="All products"
          />
          <div className="mt-8">
            <Suspense fallback={<ProductGridSkeleton />}>
              <Await resolve={latestProducts}>
                {(response) =>
                  response?.products.nodes.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {response.products.nodes.map((product, index) => (
                        <ProductItem
                          key={product.id}
                          product={product}
                          loading={index < 4 ? 'eager' : 'lazy'}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No products yet.</p>
                  )
                }
              </Await>
            </Suspense>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

/**
 * Compact vehicle picker driven by the "Make / Model" menu: one row per make,
 * its models as pills, and a link to the whole make.
 */
function VehicleSection({group}: {group: MenuGroup}) {
  return (
    <section id="vehicles" className="container-x scroll-mt-32 py-14 md:py-20">
      <SectionHeading
        eyebrow="Shop by"
        title={group.title}
        linkTo="/collections"
        linkLabel="All collections"
      />
      <p className="mt-3 max-w-2xl text-muted">
        Pick your model to see everything we stock for it.
      </p>
      <div className="mt-8 divide-y divide-border border-y border-border">
        {group.columns.map((make) => (
          <MakeRow key={make.id} make={make} />
        ))}
      </div>
    </section>
  );
}

function MakeRow({make}: {make: MenuColumn}) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[9rem_1fr_auto] md:items-center md:gap-6">
      <h3 className="text-xl leading-none">
        <MenuItemLink link={make} className="transition-colors hover:text-sand">
          {make.title}
        </MenuItemLink>
      </h3>
      <ul className="flex flex-wrap gap-2">
        {make.children.map((model) => (
          <li key={model.id}>
            <MenuItemLink link={model} className="pill hover:text-sand">
              {model.title}
            </MenuItemLink>
          </li>
        ))}
      </ul>
      <MenuItemLink
        link={make}
        className="inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-sand md:justify-self-end"
      >
        All {make.title}
        <ArrowIcon className="h-4 w-4" />
      </MenuItemLink>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  linkTo,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  linkTo: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-3xl md:text-4xl">{title}</h2>
      </div>
      <Link
        to={linkTo}
        prefetch="intent"
        className="inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-fg transition-colors hover:text-sand"
      >
        {linkLabel}
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

const HOME_COLLECTIONS_QUERY = `#graphql
  query HomeCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 12, sortKey: TITLE) {
      nodes {
        ...CollectionCard
      }
    }
  }
  ${COLLECTION_CARD_FRAGMENT}
` as const;

const LATEST_PRODUCTS_QUERY = `#graphql
  query LatestProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
