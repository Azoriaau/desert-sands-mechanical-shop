import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {ArrowIcon} from './icons';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const lines = cart?.lines?.nodes ?? [];
  const cartHasItems = lines.length > 0;
  const childrenMap = getLineItemChildrenMap(lines);

  if (!cartHasItems) {
    return <CartEmpty layout={layout} />;
  }

  const lineItems = (
    <ul aria-label="Line items" className="divide-y divide-border">
      {lines.map((line) => {
        // we do not render non-parent lines at the root of the cart
        if ('parentRelationship' in line && line.parentRelationship?.parent) {
          return null;
        }
        return (
          <CartLineItem
            key={line.id}
            line={line}
            layout={layout}
            childrenMap={childrenMap}
          />
        );
      })}
    </ul>
  );

  if (layout === 'aside') {
    return (
      <section
        aria-label="Cart drawer"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{lineItems}</div>
        <CartSummary cart={cart} layout={layout} />
      </section>
    );
  }

  return (
    <section
      aria-label="Cart page"
      className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
    >
      <div className="card px-5">{lineItems}</div>
      <CartSummary cart={cart} layout={layout} />
    </section>
  );
}

function CartEmpty({layout}: {layout: CartLayout}) {
  const {close} = useAside();
  const isAside = layout === 'aside';
  return (
    <div
      className={
        isAside
          ? 'flex flex-col items-start gap-4 p-5'
          : 'card flex flex-col items-center gap-4 p-10 text-center'
      }
    >
      <p className="eyebrow">Your cart is empty</p>
      <p className="max-w-sm text-muted">
        Nothing in here yet. Browse the range or search for the part you need.
      </p>
      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="btn btn-primary"
      >
        Shop all products
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
