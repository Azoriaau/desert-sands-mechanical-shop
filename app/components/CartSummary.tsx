import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, type OptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';
import {asMoney, formatMoney} from '~/lib/money';
import {ArrowIcon} from './icons';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const summaryId = useId();
  const isAside = layout === 'aside';
  const subtotal = asMoney(cart?.cost?.subtotalAmount);

  return (
    <div
      aria-labelledby={summaryId}
      className={
        isAside
          ? 'shrink-0 border-t border-border bg-ink-2 p-5'
          : 'card p-6 lg:sticky lg:top-28'
      }
    >
      <h2 id={summaryId} className="text-xl">
        Summary
      </h2>
      <dl className="mt-4 flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted">Subtotal</dt>
        <dd className="font-display text-xl text-fg">
          {subtotal ? formatMoney(subtotal) : '–'}
        </dd>
      </dl>
      <p className="mt-1 text-xs text-muted">
        Shipping and taxes are calculated at checkout.
      </p>
      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a href={checkoutUrl} target="_self" className="btn btn-primary mt-5 w-full">
      Checkout
      <ArrowIcon className="h-4 w-4" />
    </a>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const inputId = useId();
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <section aria-label="Discounts" className="mt-5 space-y-3">
      {codes.length > 0 && (
        <UpdateDiscountForm>
          <div className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2 text-sm">
            <span>
              <span className="text-muted">Discount </span>
              <code className="font-display uppercase tracking-wide text-sand">
                {codes.join(', ')}
              </code>
            </span>
            <button
              type="submit"
              aria-label="Remove discount"
              className="text-xs text-muted transition-colors hover:text-ember"
            >
              Remove
            </button>
          </div>
        </UpdateDiscountForm>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Discount code
          </label>
          <input
            id={inputId}
            type="text"
            name="discountCode"
            placeholder="Discount code"
            className="field"
            autoComplete="off"
          />
          <button
            type="submit"
            aria-label="Apply discount code"
            className="btn btn-outline shrink-0 px-4"
          >
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}
