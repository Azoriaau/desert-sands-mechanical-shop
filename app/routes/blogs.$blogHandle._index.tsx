import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle._index';
import {Image, getPaginationVariables} from '@shopify/hydrogen';
import type {ArticleItemFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {PageHero} from '~/components/PageHero';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) =>
  seoMeta({
    title: data?.blog.seo?.title || data?.blog.title,
    description: data?.blog.seo?.description,
    path: data ? `/blogs/${data.blog.handle}` : undefined,
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  return {blog};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const {blog} = useLoaderData<typeof loader>();
  const {articles} = blog;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={blog.title}
        crumbs={[{label: 'Blog', href: '/blogs'}]}
        crumb={blog.title}
      />
      <section className="container-x py-12 md:py-16">
        <PaginatedResourceSection<ArticleItemFragment>
          connection={articles}
          resourcesClassName="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 3 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </section>
    </>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const publishedAt = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));
  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      prefetch="intent"
      className="card group flex flex-col overflow-hidden transition-colors hover:border-sand/60"
    >
      {article.image && (
        <div className="aspect-[3/2] overflow-hidden bg-surface-2">
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="3/2"
            data={article.image}
            loading={loading}
            sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted">
          {publishedAt}
        </p>
        <h3 className="mt-2 text-xl leading-tight">{article.title}</h3>
      </div>
    </Link>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
