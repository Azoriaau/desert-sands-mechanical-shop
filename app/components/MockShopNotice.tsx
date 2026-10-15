/** Shown until the project is linked to the real Shopify store. */
export function MockShopNotice() {
  return (
    <div className="container-x pt-6">
      <section
        className="card flex flex-col gap-2 border-ember/50 p-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="mock-shop-notice-heading"
      >
        <div>
          <p id="mock-shop-notice-heading" className="eyebrow text-ember">
            Preview build
          </p>
          <p className="mt-1 text-sm text-muted">
            Showing sample products from Shopify&rsquo;s mock.shop. Link the
            Desert Sands Mechanical store to see the real range.
          </p>
        </div>
        <code className="shrink-0 rounded border border-border bg-ink px-3 py-2 text-xs text-fg/80">
          npx shopify hydrogen link
        </code>
      </section>
    </div>
  );
}
