import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {useAside} from './Aside';
import {MinusIcon, PlusIcon, TrashIcon} from './icons';
import {formatMoney} from '~/lib/money';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;
  const options = selectedOptions.filter(
    (option) => option.value !== 'Default Title',
  );

  return (
    <li key={id} className="py-4">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-surface-2">
          {image && (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={160}
              loading="lazy"
              width={160}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {product.vendor && (
            <p className="eyebrow text-[0.62rem]">{product.vendor}</p>
          )}
          <Link
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
            className="block font-display text-base uppercase leading-tight tracking-wide text-fg transition-colors hover:text-sand"
          >
            {product.title}
          </Link>
          {options.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              {options
                .map((option) => `${option.name}: ${option.value}`)
                .join(' · ')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <CartLineQuantity line={line} />
            {line?.cost?.totalAmount && (
              <span className="font-display text-base text-fg">
                {formatMoney(line.cost.totalAmount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {lineItemChildren ? (
        <div className="mt-3 pl-6">
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul
            aria-labelledby={childrenLabelId}
            className="divide-y divide-border border-l border-border pl-4"
          >
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded border border-border">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
            className="inline-flex h-9 w-9 items-center justify-center text-fg transition-colors hover:text-sand disabled:opacity-40 disabled:hover:text-fg"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </CartLineUpdateButton>
        <span
          className="min-w-8 text-center font-display text-sm"
          aria-label={`Quantity ${quantity}`}
        >
          {quantity}
        </span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
            className="inline-flex h-9 w-9 items-center justify-center text-fg transition-colors hover:text-sand disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </CartLineUpdateButton>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        disabled={disabled}
        type="submit"
        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-ember disabled:opacity-40"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
