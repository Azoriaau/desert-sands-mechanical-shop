import {Link} from 'react-router';
import {Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {ProductItem} from './ProductItem';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl">Articles</h2>
      <ul className="mt-4 divide-y divide-border">
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <li key={article.id}>
              <Link
                prefetch="intent"
                to={articleUrl}
                className="block py-3 text-fg/85 transition-colors hover:text-sand"
              >
                {article.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl">Pages</h2>
      <ul className="mt-4 divide-y divide-border">
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <li key={page.id}>
              <Link
                prefetch="intent"
                to={pageUrl}
                className="block py-3 text-fg/85 transition-colors hover:text-sand"
              >
                {page.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl">Products</h2>
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => (
          <div className="mt-6">
            <div className="flex justify-center">
              <PreviousLink className="btn btn-outline mb-8">
                {isLoading ? 'Loading…' : 'Load previous'}
              </PreviousLink>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {nodes.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  to={urlWithTrackingParams({
                    baseUrl: `/products/${product.handle}`,
                    trackingParams: product.trackingParameters,
                    term,
                  })}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <NextLink className="btn btn-outline mt-10">
                {isLoading ? 'Loading…' : 'Load more'}
              </NextLink>
            </div>
          </div>
        )}
      </Pagination>
    </section>
  );
}

function SearchResultsEmpty({term}: {term?: string}) {
  return (
    <p className="mt-8 text-muted">
      {term ? (
        <>
          No results for <q className="text-fg">{term}</q>. Try a different
          part name, brand or vehicle.
        </>
      ) : (
        'Type a part name, brand or vehicle to search the range.'
      )}
    </p>
  );
}
