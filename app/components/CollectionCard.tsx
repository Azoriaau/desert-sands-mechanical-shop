import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {ArrowIcon} from './icons';

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
 * brand logos, so the image is contained rather than cropped.
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
      className="card group relative block overflow-hidden transition-colors hover:border-sand/60"
    >
      <div className="relative aspect-[4/3] bg-surface-2">
        {image ? (
          <Image
            data={image}
            alt={image.altText || collection.title}
            aspectRatio="4/3"
            sizes="(min-width: 80rem) 20rem, (min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
            loading={loading}
            className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="tread absolute inset-0 opacity-70" aria-hidden />
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-surface via-surface/70 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-2xl leading-none">{collection.title}</h3>
          <span className="mt-2 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-sand">
            Shop now
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
