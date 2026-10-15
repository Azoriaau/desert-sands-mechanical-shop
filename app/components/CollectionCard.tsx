import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {ArrowIcon} from './icons';
import {ImagePlaceholder} from './ProductItem';

export type CollectionCardData = {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

/**
 * Tile linking to a collection. Collection images on the DSM store are mostly
 * brand logos, so the image is shown whole (no `aspectRatio` on the Image,
 * which would make the CDN crop it) and the title sits below rather than
 * over it.
 */
export function CollectionCard({
  collection,
  loading,
}: {
  collection: CollectionCardData;
  loading?: 'eager' | 'lazy';
}) {
  const {image} = collection;
  return (
    <Link
      to={`/collections/${collection.handle}`}
      prefetch="intent"
      className="card group flex flex-col overflow-hidden transition-colors hover:border-sand/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {image ? (
          <Image
            data={image}
            alt={image.altText || collection.title}
            sizes="(min-width: 80rem) 16rem, (min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
            loading={loading}
            className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <div className="tread absolute inset-0 opacity-70" aria-hidden />
            <ImagePlaceholder className="relative" />
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <h3 className="text-xl leading-none">{collection.title}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 font-display text-xs uppercase tracking-wide text-sand">
          Shop
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
