import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {PageHero} from '~/components/PageHero';
import {ArrowIcon} from '~/components/icons';
import type {BlogsQuery} from 'storefrontapi.generated';
import {seoMeta} from '~/lib/seo';

type BlogNode = BlogsQuery['blogs']['nodes'][0];

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: 'Blog',
    description: 'News and know-how from the Desert Sands Mechanical workshop.',
    path: '/blogs',
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
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blogs() {
  const {blogs} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHero eyebrow="Shop" title="Blog" crumb="Blog" />
      <section className="container-x py-12 md:py-16">
        <PaginatedResourceSection<BlogNode>
          connection={blogs}
          resourcesClassName="grid gap-4 sm:grid-cols-2"
        >
          {({node: blog}) => (
            <Link
              className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-sand/60"
              key={blog.handle}
              prefetch="intent"
              to={`/blogs/${blog.handle}`}
            >
              <span className="font-display text-lg uppercase tracking-wide">
                {blog.title}
              </span>
              <ArrowIcon className="h-5 w-5 text-sand transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </PaginatedResourceSection>
      </section>
    </>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
` as const;
