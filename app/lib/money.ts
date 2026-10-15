export type MoneyLike = {
  amount: string;
  currencyCode: string;
};

/**
 * Formats a Storefront API money value for an Australian audience.
 * Whole-dollar amounts drop the cents ("$1,170"); everything else keeps them.
 */
export function formatMoney(money: MoneyLike) {
  const value = Number(money.amount);
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Narrows a possibly-partial money object (e.g. from an optimistic cart) to a
 * complete one, or null when either field is missing.
 */
export function asMoney(
  money:
    | {amount?: string | null; currencyCode?: string | null}
    | null
    | undefined,
): MoneyLike | null {
  if (!money?.amount || !money.currencyCode) return null;
  return {amount: money.amount, currencyCode: money.currencyCode};
}

/** True when a product has no price set, which the shop shows as "enquire". */
export function isZero(money: MoneyLike | null | undefined) {
  return !money || Number(money.amount) === 0;
}
