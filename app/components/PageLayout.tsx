import {Await, Link} from 'react-router';
import {Suspense, useId} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {ArrowIcon} from '~/components/icons';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({cart, children = null, footer}: PageLayoutProps) {
  return (
    <Aside.Provider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-sand focus:px-4 focus:py-2 focus:font-display focus:uppercase focus:text-ink"
      >
        Skip to content
      </a>
      <Header cart={cart} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer footer={footer} />
      <CartAside cart={cart} />
      <SearchAside />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="Your cart">
      <Suspense
        fallback={<p className="p-5 text-sm text-muted">Loading cart…</p>}
      >
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="Search">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border p-5">
          <SearchFormPredictive>
            {({fetchResults, goToSearch, inputRef}) => (
              <div className="flex gap-2">
                <input
                  name="q"
                  onChange={fetchResults}
                  onFocus={fetchResults}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      goToSearch();
                    }
                  }}
                  placeholder="Search parts, brands, vehicles…"
                  ref={inputRef}
                  type="search"
                  list={queriesDatalistId}
                  autoComplete="off"
                  className="field"
                  aria-label="Search products"
                />
                <button
                  type="button"
                  onClick={goToSearch}
                  className="btn btn-primary shrink-0 px-4"
                  aria-label="See all results"
                >
                  <ArrowIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </SearchFormPredictive>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <SearchResultsPredictive>
            {({items, total, term, state, closeSearch}) => {
              const {articles, collections, pages, products, queries} = items;

              if (state === 'loading' && term.current) {
                return <p className="text-sm text-muted">Searching…</p>;
              }

              if (!total) {
                return <SearchResultsPredictive.Empty term={term} />;
              }

              return (
                <div className="space-y-8">
                  <SearchResultsPredictive.Queries
                    queries={queries}
                    queriesDatalistId={queriesDatalistId}
                  />
                  <SearchResultsPredictive.Products
                    products={products}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Collections
                    collections={collections}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Pages
                    pages={pages}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Articles
                    articles={articles}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  {term.current && total ? (
                    <Link
                      onClick={closeSearch}
                      to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term.current)}`}
                      className="btn btn-outline w-full"
                    >
                      View all results for “{term.current}”
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              );
            }}
          </SearchResultsPredictive>
        </div>
      </div>
    </Aside>
  );
}
