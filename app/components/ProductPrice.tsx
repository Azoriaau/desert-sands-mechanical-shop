import {formatMoney, isZero, type MoneyLike} from '~/lib/money';

export function ProductPrice({
  price,
  compareAtPrice,
  className,
}: {
  price?: MoneyLike | null;
  compareAtPrice?: MoneyLike | null;
  className?: string;
}) {
  if (!price) return null;

  if (isZero(price)) {
    return (
      <p className={`font-display text-2xl text-muted ${className ?? ''}`}>
        Enquire for price
      </p>
    );
  }

  const sale =
    compareAtPrice && Number(compareAtPrice.amount) > Number(price.amount)
      ? compareAtPrice
      : null;

  return (
    <p
      aria-label="Price"
      className={`flex flex-wrap items-baseline gap-3 ${className ?? ''}`}
    >
      <span className="font-display text-3xl text-fg">{formatMoney(price)}</span>
      {sale && (
        <>
          <s className="font-display text-lg text-muted">{formatMoney(sale)}</s>
          <span className="rounded bg-ember/15 px-2 py-0.5 font-display text-xs uppercase tracking-wide text-ember">
            Sale
          </span>
        </>
      )}
    </p>
  );
}
