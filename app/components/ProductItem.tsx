import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {formatMoney, isZero, type MoneyLike} from '~/lib/money';

/** Structural type so any query that spreads ...ProductCard (or equivalent) fits. */
export type ProductCardData = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale?: boolean | null;
  featuredImage?: {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange: {
    minVariantPrice: MoneyLike;
    maxVariantPrice?: MoneyLike | null;
  };
};

export function ProductItem({
  product,
  loading,
  to,
}: {
  product: ProductCardData;
  loading?: 'eager' | 'lazy';
  /** Override the link target, e.g. to carry search tracking params. */
  to?: string;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const {minVariantPrice: min, maxVariantPrice: max} = product.priceRange;
  const hasRange = max ? Number(max.amount) > Number(min.amount) : false;
  const soldOut = product.availableForSale === false;

  return (
    <Link
      className="card group flex flex-col overflow-hidden transition-colors hover:border-sand/60"
      prefetch="intent"
      to={to ?? variantUrl}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 80rem) 20rem, (min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded bg-ink/80 px-2 py-1 font-display text-xs uppercase tracking-wide text-muted">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.vendor && (
          <p className="eyebrow text-[0.68rem]">{product.vendor}</p>
        )}
        <h3 className="mt-1 line-clamp-3 text-lg leading-tight">
          {product.title}
        </h3>
        <p className="mt-auto pt-3 font-display text-base text-fg">
          {isZero(min) ? (
            <span className="text-muted">Enquire for price</span>
          ) : (
            <>
              {hasRange && <span className="text-muted">From </span>}
              {formatMoney(min)}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Dark tile with a faint brand badge, for products or collections without an image. */
export function ImagePlaceholder({className}: {className?: string}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className ?? ''}`}
      aria-hidden
    >
      <img
        src="/brand/dsm-badge-small.png"
        alt=""
        className="h-1/3 w-auto opacity-20"
        loading="lazy"
      />
    </div>
  );
}

/** Loading placeholder matching the card footprint. */
export function ProductGridSkeleton({count = 4}: {count?: number}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({length: count}).map((_, i) => (
        // Static placeholders: the index is the only identity they have.
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="card animate-pulse">
          <div className="aspect-square bg-surface-2" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-surface-2" />
            <div className="h-4 w-3/4 rounded bg-surface-2" />
            <div className="h-4 w-1/4 rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
