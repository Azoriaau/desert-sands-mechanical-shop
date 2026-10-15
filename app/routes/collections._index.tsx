import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {CollectionCardFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CollectionCard} from '~/components/CollectionCard';
import {PageHero} from '~/components/PageHero';
import {COLLECTION_CARD_FRAGMENT} from '~/lib/fragments';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: 'Collections',
    description:
      'Browse Desert Sands Mechanical parts and performance gear by vehicle and brand.',
    path: '/collections',
  });

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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Collections"
        intro="Browse the range by vehicle or brand."
        crumb="Collections"
      />
      <section className="container-x py-12 md:py-16">
        {collections.nodes.length ? (
          <PaginatedResourceSection<CollectionCardFragment>
            connection={collections}
            resourcesClassName="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {({node: collection, index}) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                loading={index < 6 ? 'eager' : 'lazy'}
              />
            )}
          </PaginatedResourceSection>
        ) : (
          <p className="text-muted">No collections yet.</p>
        )}
      </section>
    </>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: TITLE
    ) {
      nodes {
        ...CollectionCard
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_CARD_FRAGMENT}
` as const;
