import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {ImagePlaceholder} from './ProductItem';

export type GalleryImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Main product image with a thumbnail strip. Follows the selected variant's
 * image when it changes, but lets the shopper browse the other photos too.
 */
export function ProductGallery({
  images,
  selectedImage,
  title,
}: {
  images: GalleryImage[];
  selectedImage?: GalleryImage | null;
  title: string;
}) {
  const all = mergeImages(images, selectedImage);
  const [activeId, setActiveId] = useState<string | null | undefined>(
    selectedImage?.id ?? all[0]?.id,
  );

  useEffect(() => {
    if (selectedImage?.id) setActiveId(selectedImage.id);
  }, [selectedImage?.id]);

  const active = all.find((img) => img.id === activeId) ?? all[0];

  if (!active) {
    return (
      <div className="card aspect-square overflow-hidden">
        <ImagePlaceholder />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="card overflow-hidden">
        <div className="aspect-square bg-surface-2">
          <Image
            key={active.id ?? active.url}
            data={active}
            alt={active.altText || title}
            aspectRatio="1/1"
            sizes="(min-width: 64rem) 50vw, 100vw"
            loading="eager"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      {all.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {all.map((img, index) => {
            const isActive = img.id === active.id;
            return (
              <li key={img.id ?? img.url}>
                <button
                  type="button"
                  onClick={() => setActiveId(img.id)}
                  aria-label={`Show image ${index + 1} of ${all.length}`}
                  aria-pressed={isActive}
                  className={`block aspect-square w-full overflow-hidden rounded border bg-surface-2 transition-colors ${
                    isActive ? 'border-sand' : 'border-border hover:border-muted'
                  }`}
                >
                  <Image
                    data={img}
                    alt=""
                    aspectRatio="1/1"
                    sizes="6rem"
                    width={160}
                    height={160}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function mergeImages(
  images: GalleryImage[],
  selected?: GalleryImage | null,
): GalleryImage[] {
  const list = [...images];
  if (selected && !list.some((img) => img.id === selected.id)) {
    list.unshift(selected);
  }
  return list;
}
