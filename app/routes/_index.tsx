import {Await, Link, useLoaderData, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RootLoader} from '~/root';
import {ProductGridSkeleton, ProductItem} from '~/components/ProductItem';
import {
  CollectionCard,
  type CollectionCardData,
} from '~/components/CollectionCard';
import {MenuItemLink} from '~/components/MenuItemLink';
import {MockShopNotice} from '~/components/MockShopNotice';
import {CTABand} from '~/components/CTABand';
import {ArrowIcon} from '~/components/icons';
import {COLLECTION_CARD_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {
  collectionHandleFromHref,
  EMPTY_SHOP_MENU,
  type MenuColumn,
  type MenuGroup,
} from '~/lib/menu';
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
  // The Make / Model and Catalogue groups come from the Shopify main menu,
  // loaded once in the root loader for the header.
  const shopMenu =
    useRouteLoaderData<RootLoader>('root')?.shopMenu ?? EMPTY_SHOP_MENU;
  const {vehicles, others} = shopMenu;
  const hasMenu = vehicles !== null || others.length > 0;
  const collectionsByHandle = new Map<string, CollectionCardData>(
    collections.map((collection) => [collection.handle, collection]),
  );

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

      {hasMenu ? (
        <div className="container-x space-y-14 py-14 md:space-y-20 md:py-20">
          {vehicles && <VehicleSection group={vehicles} />}
          {others.map((group) => (
            <BrandSection
              key={group.id}
              group={group}
              collectionsByHandle={collectionsByHandle}
            />
          ))}
        </div>
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

/** Makes → models, one card per make, driven by the "Make / Model" menu. */
function VehicleSection({group}: {group: MenuGroup}) {
  return (
    <section id="vehicles" className="scroll-mt-32">
      <SectionHeading
        eyebrow="Shop by"
        title={group.title}
        linkTo="/collections"
        linkLabel="All collections"
      />
      <p className="mt-3 max-w-2xl text-muted">
        Pick your model to see everything we stock for it, or open a make to
        browse the lot.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {group.columns.map((make) => (
          <MakeCard key={make.id} make={make} />
        ))}
      </div>
    </section>
  );
}

function MakeCard({make}: {make: MenuColumn}) {
  return (
    <div className="card flex flex-col p-6">
      <h3 className="text-2xl leading-none">
        <MenuItemLink link={make} className="transition-colors hover:text-sand">
          {make.title}
        </MenuItemLink>
      </h3>
      {make.children.length > 0 && (
        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {make.children.map((model) => (
            <li key={model.id}>
              <MenuItemLink
                link={model}
                className="group/model flex items-center justify-between gap-3 py-2 text-sm text-fg/85 transition-colors hover:text-sand"
              >
                {model.title}
                <ArrowIcon className="h-3.5 w-3.5 shrink-0 text-sand opacity-0 transition group-hover/model:opacity-100" />
              </MenuItemLink>
            </li>
          ))}
        </ul>
      )}
      <MenuItemLink
        link={make}
        className="mt-auto inline-flex items-center gap-1.5 pt-5 font-display text-sm uppercase tracking-wide text-sand"
      >
        All {make.title}
        <ArrowIcon className="h-4 w-4" />
      </MenuItemLink>
    </div>
  );
}

/** A flat menu group (e.g. "Catalogue") as logo tiles, using collection images. */
function BrandSection({
  group,
  collectionsByHandle,
}: {
  group: MenuGroup;
  collectionsByHandle: Map<string, CollectionCardData>;
}) {
  return (
    <section>
      <SectionHeading
        eyebrow="More ways to shop"
        title={group.title}
        linkTo="/collections"
        linkLabel="All collections"
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {group.columns.map((link, index) => {
          const handle = collectionHandleFromHref(link.href);
          const collection = handle ? collectionsByHandle.get(handle) : null;
          return collection ? (
            <CollectionCard
              key={link.id}
              collection={{...collection, title: link.title}}
              loading={index < 5 ? 'eager' : 'lazy'}
            />
          ) : (
            <MenuItemLink
              key={link.id}
              link={link}
              className="card tread flex aspect-[4/3] items-end p-5 transition-colors hover:border-sand/60"
            >
              <h3 className="text-2xl leading-none">{link.title}</h3>
            </MenuItemLink>
          );
        })}
      </div>
    </section>
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
    collections(first: 50, sortKey: TITLE) {
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
